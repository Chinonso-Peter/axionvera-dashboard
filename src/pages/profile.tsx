import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";
import SecuritySettingsForm from "@/components/SecuritySettingsForm";
import { UserProfileSkeleton } from "@/components/Skeletons";
import { useSidebar } from "@/hooks/useSidebar";
import { useWalletContext } from "@/hooks/useWallet";
import { ProfileFormData, SecuritySettingsFormData } from "@/utils/validation";
import { useEffect } from "react";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen } = useSidebar();
  const wallet = useWalletContext();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    console.log('Profile data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSecuritySubmit = async (data: SecuritySettingsFormData) => {
    console.log('Security data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <>
      <Head>
        <title>Profile · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary">
        <Navbar
          publicKey={wallet.publicKey}
          isConnecting={wallet.isConnecting}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:pl-64' : ''}`}>
          <div className="mx-auto max-w-7xl px-6 py-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link 
                    href="/dashboard" 
                    className="text-text-muted hover:text-axion-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="text-text-muted">/</li>
                <li>
                  <span className="text-text-primary font-medium" aria-current="page">
                    Profile
                  </span>
                </li>
              </ol>
            </nav>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
              <p className="mt-2 text-text-muted">
                Manage your account settings and preferences.
              </p>
            </div>

            {/* Two-Column Layout */}
            {isLoading ? (
              <div className="space-y-6">
                <UserProfileSkeleton />
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Left Column - Profile Information */}
                <div className="space-y-6">
                  <ProfileForm
                    initialData={{
                      firstName: 'John',
                      lastName: 'Doe',
                      email: 'john.doe@example.com',
                      bio: 'Passionate about decentralized finance and blockchain technology.',
                      website: 'https://johndoe.dev',
                      location: 'San Francisco, CA',
                    }}
                    onSubmit={handleProfileSubmit}
                  />
                </div>

                {/* Right Column - Security Settings */}
                <div className="space-y-6">
                  <SecuritySettingsForm onSubmit={handleSecuritySubmit} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
