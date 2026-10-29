import { NextRequest, NextResponse } from 'next/server';
import { SellerPayoutMethod } from '@/lib/models';
import { getSellerFromRequest } from '@/lib/seller-auth';
import { connectDB } from '@/lib/mongodb';
import { decryptPayoutDetails, encryptPayoutDetails, maskPayoutIdentifier } from '@/lib/server/seller-payout-methods';

export const dynamic = 'force-dynamic';

const providers = ['nayapay', 'jazzcash', 'easypaisa', 'meezan_bank', 'hbl', 'sadapay'] as const;
type Provider = typeof providers[number];

export async function GET() {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    await connectDB();
    const methods = await SellerPayoutMethod.find({ seller_id: seller._id })
      .select('provider +encrypted_details last_four status review_note is_default created_at')
      .sort({ is_default: -1, created_at: -1 })
      .lean();
    return NextResponse.json({
      success: true,
      data: methods.map((method) => {
        const details = decryptPayoutDetails(method.encrypted_details);
        return {
          _id: String(method._id),
          provider: method.provider,
          account_holder: details.account_holder,
          identifier_kind: details.identifier_kind,
          masked_identifier: maskPayoutIdentifier(method.last_four),
          status: method.status,
          review_note: method.review_note,
          is_default: method.is_default,
          created_at: method.created_at,
        };
      }),
    });
  } catch (error) {
    console.error('Seller payout methods failed:', error);
    return NextResponse.json({ success: false, message: 'Could not load payout methods.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid payout method details.' }, { status: 400 });
    }
    const provider = typeof body.provider === 'string' ? body.provider : '';
    const accountHolder = typeof body.account_holder === 'string' ? body.account_holder.trim() : '';
    const rawIdentifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    if (!providers.includes(provider as Provider)) {
      return NextResponse.json({ success: false, message: 'Choose a supported payout provider.' }, { status: 400 });
    }
    if (accountHolder.length < 2 || accountHolder.length > 120) {
      return NextResponse.json({ success: false, message: 'Enter the account holder name (2–120 characters).' }, { status: 400 });
    }

    const isWallet = provider !== 'meezan_bank' && provider !== 'hbl';
    const identifier = isWallet
      ? rawIdentifier.replace(/[\s()-]/g, '')
      : rawIdentifier.replace(/[\s-]/g, '').toUpperCase();
    const validIdentifier = isWallet
      ? /^(?:03\d{9}|\+923\d{9}|923\d{9})$/.test(identifier)
      : /^[A-Z0-9]{8,34}$/.test(identifier);
    if (!validIdentifier) {
      return NextResponse.json({
        success: false,
        message: isWallet
          ? 'Enter a valid Pakistani mobile number, such as 03XXXXXXXXX or +923XXXXXXXXX.'
          : 'Enter a valid IBAN or bank account number (8–34 letters or digits).',
      }, { status: 400 });
    }

    await connectDB();
    const existing = await SellerPayoutMethod.findOne({ seller_id: seller._id, provider }).select('_id is_default').lean();
    const makeDefault = body.is_default === true || !existing;
    const shouldRemoveDefault = Boolean(existing?.is_default) && body.is_default !== true;
    const method = await SellerPayoutMethod.findOneAndUpdate(
      { seller_id: seller._id, provider },
      {
        $set: {
          encrypted_details: encryptPayoutDetails({
            account_holder: accountHolder,
            identifier,
            identifier_kind: isWallet ? 'mobile' : 'bank_account',
          }),
          last_four: identifier.slice(-4),
          status: 'pending_review',
          review_note: '',
        },
        $setOnInsert: { seller_id: seller._id, provider },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select('provider last_four status review_note is_default created_at');
    if (!method) return NextResponse.json({ success: false, message: 'Could not save this payout method.' }, { status: 500 });
    if (makeDefault) {
      await SellerPayoutMethod.updateMany({ seller_id: seller._id }, { $set: { is_default: false } });
      method.is_default = true;
      await method.save();
    } else if (shouldRemoveDefault) {
      method.is_default = false;
      await method.save();
    }
    return NextResponse.json({
      success: true,
      data: {
        _id: method.id,
        provider: method.provider,
        account_holder: accountHolder,
        identifier_kind: isWallet ? 'mobile' : 'bank_account',
        masked_identifier: maskPayoutIdentifier(identifier),
        status: method.status,
        review_note: method.review_note,
        is_default: method.is_default,
        created_at: method.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Seller payout method save failed:', error);
    return NextResponse.json({ success: false, message: 'Could not save this payout method.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid payout method.' }, { status: 400 });
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ success: false, message: 'Invalid payout method.' }, { status: 400 });

    await connectDB();
    const method = await SellerPayoutMethod.findOne({ _id: id, seller_id: seller._id });
    if (!method) return NextResponse.json({ success: false, message: 'Payout method not found.' }, { status: 404 });
    await SellerPayoutMethod.updateMany({ seller_id: seller._id }, { $set: { is_default: false } });
    method.is_default = true;
    await method.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller default payout method update failed:', error);
    return NextResponse.json({ success: false, message: 'Could not update the default payout method.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const seller = await getSellerFromRequest();
    if (!seller) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    if (seller.status !== 'approved') return NextResponse.json({ success: false, message: 'Seller approval is required.' }, { status: 403 });
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: 'Invalid payout method.' }, { status: 400 });
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ success: false, message: 'Invalid payout method.' }, { status: 400 });

    await connectDB();
    const method = await SellerPayoutMethod.findOneAndDelete({ _id: id, seller_id: seller._id });
    if (!method) return NextResponse.json({ success: false, message: 'Payout method not found.' }, { status: 404 });
    if (method.is_default) {
      const replacement = await SellerPayoutMethod.findOne({ seller_id: seller._id }).sort({ created_at: -1 });
      if (replacement) {
        replacement.is_default = true;
        await replacement.save();
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller payout method removal failed:', error);
    return NextResponse.json({ success: false, message: 'Could not remove the payout method.' }, { status: 500 });
  }
}
