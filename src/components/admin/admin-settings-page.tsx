'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Settings,
  Globe,
  Mail,
  Shield,
  CreditCard,
  Palette,
  Bell,
  Database,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from './admin-layout'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

interface AdminSettingsPageProps {
  user: User
}

interface Settings {
  general: {
    siteName: { value: string }
    siteDescription: { value: string }
    siteUrl: { value: string }
    contactEmail: { value: string }
    supportEmail: { value: string }
    maintenanceMode: { value: boolean }
    registrationEnabled: { value: boolean }
  }
  social: {
    socialLinks: {
      value: {
        twitter?: string
        facebook?: string
        instagram?: string
        linkedin?: string
        github?: string
      }
    }
  }
  seo: {
    seoSettings: {
      value: {
        metaTitle?: string
        metaDescription?: string
        metaKeywords?: string
        ogImage?: string
      }
    }
  }
  email: {
    emailSettings: {
      value: {
        smtpHost?: string
        smtpPort?: number
        smtpUser?: string
        smtpPassword?: string
        fromEmail?: string
        fromName?: string
      }
    }
  }
  payment: {
    paymentSettings: {
      value: {
        currency?: string
        taxRate?: number
        shippingRate?: number
        freeShippingThreshold?: number
      }
    }
  }
  security: {
    securitySettings: {
      value: {
        enableTwoFactor?: boolean
        sessionTimeout?: number
        maxLoginAttempts?: number
        passwordMinLength?: number
      }
    }
  }
}

export function AdminSettingsPage({ user }: AdminSettingsPageProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings')
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch settings')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setIsSaving(true)

      // Prepare settings data for API
      const settingsData: any = {}

      // General settings
      if (settings.general) {
        settingsData.siteName = settings.general.siteName?.value
        settingsData.siteDescription = settings.general.siteDescription?.value
        settingsData.siteUrl = settings.general.siteUrl?.value
        settingsData.contactEmail = settings.general.contactEmail?.value
        settingsData.supportEmail = settings.general.supportEmail?.value
        settingsData.maintenanceMode = settings.general.maintenanceMode?.value
        settingsData.registrationEnabled = settings.general.registrationEnabled?.value
      }

      // Social settings
      if (settings.social?.socialLinks) {
        settingsData.socialLinks = settings.social.socialLinks.value
      }

      // SEO settings
      if (settings.seo?.seoSettings) {
        settingsData.seoSettings = settings.seo.seoSettings.value
      }

      // Email settings
      if (settings.email?.emailSettings) {
        settingsData.emailSettings = settings.email.emailSettings.value
      }

      // Payment settings
      if (settings.payment?.paymentSettings) {
        settingsData.paymentSettings = settings.payment.paymentSettings.value
      }

      // Security settings
      if (settings.security?.securitySettings) {
        settingsData.securitySettings = settings.security.securitySettings.value
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData)
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
        fetchSettings() // Refresh settings
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (category: keyof Settings, key: string, value: any) => {
    if (!settings) return

    setSettings(prev => {
      if (!prev) return prev

      const newSettings = { ...prev }
      
      if (!newSettings[category]) {
        newSettings[category] = {} as any
      }

      if (!newSettings[category][key as keyof typeof newSettings[typeof category]]) {
        (newSettings[category] as any)[key] = { value }
      } else {
        (newSettings[category] as any)[key].value = value
      }

      return newSettings
    })
  }

  const updateNestedSetting = (category: keyof Settings, parentKey: string, childKey: string, value: any) => {
    if (!settings) return

    setSettings(prev => {
      if (!prev) return prev

      const newSettings = { ...prev }
      
      if (!newSettings[category]) {
        newSettings[category] = {} as any
      }

      if (!newSettings[category][parentKey as keyof typeof newSettings[typeof category]]) {
        (newSettings[category] as any)[parentKey] = { value: {} }
      }

      const currentValue = (newSettings[category] as any)[parentKey].value || {}
      ;(newSettings[category] as any)[parentKey].value = {
        ...currentValue,
        [childKey]: value
      }

      return newSettings
    })
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage website settings and configuration</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings?.general?.siteName?.value || ''}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                      placeholder="NusantaraHax"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">Site URL</Label>
                    <Input
                      id="siteUrl"
                      value={settings?.general?.siteUrl?.value || ''}
                      onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                      placeholder="https://nusantarahax.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings?.general?.siteDescription?.value || ''}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    placeholder="Premium game hacks and cheats for Indonesian gamers"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings?.general?.contactEmail?.value || ''}
                      onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                      placeholder="contact@nusantarahax.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings?.general?.supportEmail?.value || ''}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                      placeholder="support@nusantarahax.com"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Enable maintenance mode to show maintenance page</p>
                  </div>
                  <Switch
                    checked={settings?.general?.maintenanceMode?.value || false}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration</Label>
                    <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                  </div>
                  <Switch
                    checked={settings?.general?.registrationEnabled?.value || false}
                    onCheckedChange={(checked) => updateSetting('general', 'registrationEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Settings */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={settings?.social?.socialLinks?.value?.twitter || ''}
                      onChange={(e) => updateNestedSetting('social', 'socialLinks', 'twitter', e.target.value)}
                      placeholder="https://twitter.com/nusantarahax"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={settings?.social?.socialLinks?.value?.facebook || ''}
                      onChange={(e) => updateNestedSetting('social', 'socialLinks', 'facebook', e.target.value)}
                      placeholder="https://facebook.com/nusantarahax"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={settings?.social?.socialLinks?.value?.instagram || ''}
                      onChange={(e) => updateNestedSetting('social', 'socialLinks', 'instagram', e.target.value)}
                      placeholder="https://instagram.com/nusantarahax"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={settings?.social?.socialLinks?.value?.github || ''}
                      onChange={(e) => updateNestedSetting('social', 'socialLinks', 'github', e.target.value)}
                      placeholder="https://github.com/nusantarahax"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would continue here... */}
        </Tabs>
      </div>
    </AdminLayout>
  )
}
