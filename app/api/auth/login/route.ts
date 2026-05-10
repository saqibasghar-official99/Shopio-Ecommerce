import { NextRequest, NextResponse } from 'next/server';
import { validateAdminFromDB, generateAdminToken, COOKIE_OPTIONS } from '@/lib/auth';

// POST /api/auth/login - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, data: null, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await validateAdminFromDB(email, password);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, data: null, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(email, result.name, result.role);

    const response = NextResponse.json({
      success: true,
      data: { email, name: result.name, role: result.role },
      message: 'Login successful',
    });

    response.cookies.set('admin_token', token, COOKIE_OPTIONS);

    return response;
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Login failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/login - Admin logout
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    });

    response.cookies.set('admin_token', '', { maxAge: 0 });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
