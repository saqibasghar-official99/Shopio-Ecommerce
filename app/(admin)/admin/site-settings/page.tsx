'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, GripVertical, Globe, Image, Megaphone, Search, FileText, Info, Share2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/contexts/ToastContext';
import type { SiteSettings, Banner } from '@/lib/types';

export default function AdminSiteSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General
  const [storeName, setStoreName] = useState('');
  const [logo, setLogo] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('$');

  // Banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');

  // Announcement
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  // Policies
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [aboutText, setAboutText] = useState('');

  // Social
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        if (data) {
          const mappedSettings = { ...data, id: data._id || data.id };
          setSettings(mappedSettings);
          setStoreName(data.store_name || '');
          setLogo(data.logo || '');
          setPhone(data.phone || '');
          setWhatsappNumber(data.whatsapp_number || '');
          setWhatsappMessage(data.whatsapp_message || '');
          setAddress(data.address || '');
          setCurrency(data.currency || '$');
          setBanners(data.banners || []);
          setAnnouncementText(data.announcement_bar?.text || '');
          setAnnouncementActive(data.announcement_bar?.isActive || false);
          setMetaTitle(data.meta_title || '');
          setMetaDesc(data.meta_desc || '');
          setShippingPolicy(data.shipping_policy || '');
          setReturnPolicy(data.return_policy || '');
          setAboutText(data.about_text || '');
          setSocialLinks(data.social_links || {});
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...(settings?.id ? { _id: settings.id } : {}),
        store_name: storeName,
        logo,
        phone,
        whatsapp_number: whatsappNumber,
        whatsapp_message: whatsappMessage,
        address,
        currency,
        banners,
        announcement_bar: { text: announcementText, isActive: announcementActive },
        meta_title: metaTitle,
        meta_desc: metaDesc,
        shipping_policy: shippingPolicy,
        return_policy: returnPolicy,
        about_text: aboutText,
        social_links: socialLinks,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Settings saved successfully', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    if (bannerImage.trim()) {
      setBanners((prev) => [...prev, { image: bannerImage.trim(), link: bannerLink.trim(), isActive: true }]);
      setBannerImage('');
      setBannerLink('');
    }
  };

  const removeBanner = (idx: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveBanner = (idx: number, direction: 'up' | 'down') => {
    setBanners((prev) => {
      const next = [...prev];
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const toggleBannerActive = (idx: number) => {
    setBanners((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: url }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Site Settings</h1>
        <Button onClick={handleSave} disabled={saving} className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="general" className="text-xs">
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="banners" className="text-xs">
            <Image className="mr-1.5 h-3.5 w-3.5" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="announcement" className="text-xs">
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />
            Announcement
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Social Links
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">Store Name</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-8 text-xs" placeholder="My Store" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">Logo URL</Label>
                  <Input value={logo} onChange={(e) => setLogo(e.target.value)} className="h-8 text-xs" placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-xs" placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">Currency Symbol</Label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-8 text-xs" placeholder="$" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">WhatsApp Number</Label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="h-8 text-xs" placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">WhatsApp Message</Label>
                  <Input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} className="h-8 text-xs" placeholder="Hello, I have a question..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="text-xs" rows={2} placeholder="Store address" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banners */}
        <TabsContent value="banners">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">Banners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-sm text-gray-700">Image URL</Label>
                  <Input value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} className="h-8 text-xs" placeholder="https://..." />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-sm text-gray-700">Link URL</Label>
                  <Input value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} className="h-8 text-xs" placeholder="https://..." />
                </div>
                <div className="flex items-end">
                  <Button onClick={addBanner} variant="outline" className="h-8 text-xs shrink-0">
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>

              {banners.length > 0 && (
                <div className="space-y-2">
                  {banners.map((banner, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded border p-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveBanner(idx, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <GripVertical className="h-4 w-4 rotate-180" />
                        </button>
                        <button onClick={() => moveBanner(idx, 'down')} disabled={idx === banners.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </div>

                      {banner.image && (
                        <img src={banner.image} alt="" className="h-10 w-16 rounded object-cover shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{banner.link || 'No link'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={banner.isActive} onCheckedChange={() => toggleBannerActive(idx)} />
                        <button onClick={() => removeBanner(idx)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {banners.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">No banners added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcement */}
        <TabsContent value="announcement">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">Announcement Bar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                <Label className="text-sm text-gray-700">Show Announcement Bar</Label>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Announcement Text</Label>
                <Input
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Free shipping on orders over $50!"
                />
              </div>
              {announcementActive && announcementText && (
                <div className="rounded-md bg-green-600 px-4 py-2 text-xs text-white">
                  {announcementText}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Meta Title</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="h-8 text-xs" placeholder="My Store - Best Products" />
                <p className="text-xs text-gray-400">{metaTitle.length}/60 characters</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Meta Description</Label>
                <Textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  className="text-xs"
                  rows={3}
                  placeholder="Shop the best products at My Store..."
                />
                <p className="text-xs text-gray-400">{metaDesc.length}/160 characters</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">Store Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Shipping Policy</Label>
                <Textarea
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  className="text-xs"
                  rows={5}
                  placeholder="We ship within 2-3 business days..."
                />
              </div>
              <Separator />
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">Return Policy</Label>
                <Textarea
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  className="text-xs"
                  rows={5}
                  placeholder="Returns accepted within 7 days..."
                />
              </div>
              <Separator />
              <div className="space-y-1">
                <Label className="text-sm text-gray-700">About Us</Label>
                <Textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="text-xs"
                  rows={5}
                  placeholder="Our story..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Facebook', 'Instagram', 'TikTok', 'YouTube'].map((platform) => (
                <div key={platform} className="space-y-1">
                  <Label className="text-sm text-gray-700">{platform} URL</Label>
                  <Input
                    value={socialLinks[platform.toLowerCase()] || ''}
                    onChange={(e) => updateSocialLink(platform.toLowerCase(), e.target.value)}
                    className="h-8 text-xs"
                    placeholder={`https://${platform.toLowerCase()}.com/...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
