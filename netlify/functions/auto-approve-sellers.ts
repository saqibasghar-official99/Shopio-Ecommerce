import { connectDB } from '../../lib/mongodb';
import Seller from '../../lib/models/Seller';

export const config = {
  schedule: '* * * * *',
};

export default async function autoApproveSellers() {
  await connectDB();

  const now = new Date();
  const result = await Seller.updateMany(
    {
      status: 'pending',
      auto_approve_at: { $lte: now },
    },
    { $set: { status: 'approved' }, $unset: { auto_approve_at: 1 } }
  );

  const summary = { approved: result.modifiedCount };
  if (summary.approved > 0) console.info('Automatic seller approval completed:', summary);
  return { statusCode: 200, body: JSON.stringify(summary) };
}
