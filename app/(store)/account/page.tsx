'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Loader as Loader2, Package, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

interface CustomerData {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

const AUTH_KEY = 'shopease_customer';

export default function AccountPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [hydrated, setHydrated] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // Logged-in state
  const [loggedIn, setLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setLoggedIn(true);
        setCustomer(data);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const persistCustomer = (data: CustomerData) => {
    setLoggedIn(true);
    setCustomer(data);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } catch {}
  };

  const validateLogin = (): boolean => {
    const errors: Record<string, string> = {};
    if (!loginForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginForm.email)) errors.email = 'Invalid email';
    if (!loginForm.password) errors.password = 'Password is required';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {};
    if (!registerForm.name.trim()) errors.name = 'Name is required';
    if (!registerForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerForm.email)) errors.email = 'Invalid email';
    if (!registerForm.password) errors.password = 'Password is required';
    else if (registerForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        persistCustomer(data.data);
        showToast('Logged in successfully!');
      } else {
        showToast(data.message || 'Invalid credentials', 'error');
      }
    } catch {
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          password: registerForm.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        persistCustomer(data.data);
        showToast('Account created successfully!');
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch {
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCustomer(null);
    setLoginForm({ email: '', password: '' });
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    showToast('Logged out successfully');
  };

  if (!hydrated) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Logged-in view
  if (loggedIn && customer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-lg p-6 bg-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 min-w-12 min-h-12 shrink-0 rounded-full bg-[#7A1F3D] flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Profile info */}
          <div className="mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Phone</span>
                <span className="text-gray-900">{customer.phone || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">City</span>
                <span className="text-gray-900">{customer.city || 'Not set'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block text-xs">Address</span>
                <span className="text-gray-900">{customer.address || 'Not set'}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Quick actions */}
          <div className="mb-6 space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <Link href="/orders" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
              <Package className="h-4 w-4 text-[#7A1F3D]" />
              <span className="text-sm text-gray-700">Track My Orders</span>
            </Link>
          </div>

          <Separator className="mb-6" />

          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  // Guest / logged-out view
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="rounded-lg p-6 bg-white">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#7A1F3D] flex items-center justify-center mx-auto mb-3">
            <User className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">My Account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to track orders and manage your profile
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1 gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={`pl-9 h-9 text-sm ${loginErrors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {loginErrors.email && <p className="text-xs text-red-500 mt-0.5">{loginErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={`pl-9 h-9 text-sm ${loginErrors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {loginErrors.password && <p className="text-xs text-red-500 mt-0.5">{loginErrors.password}</p>}
              </div>

              <Button type="submit" className="w-full h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
              </Button>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`h-9 text-sm ${registerErrors.name ? 'border-red-500' : ''}`}
                />
                {registerErrors.name && <p className="text-xs text-red-500 mt-0.5">{registerErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={`pl-9 h-9 text-sm ${registerErrors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {registerErrors.email && <p className="text-xs text-red-500 mt-0.5">{registerErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Phone (optional)</label>
                <Input
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={`pl-9 h-9 text-sm ${registerErrors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {registerErrors.password && <p className="text-xs text-red-500 mt-0.5">{registerErrors.password}</p>}
              </div>

              <Button type="submit" className="w-full h-10 bg-[#7A1F3D] hover:bg-[#7A1F3D] text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <p className="text-xs text-gray-400 text-center">
          Account features are optional. You can always checkout as a guest.
        </p>
      </div>
    </div>
  );
}
