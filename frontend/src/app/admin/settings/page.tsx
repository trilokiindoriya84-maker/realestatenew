'use client';

import { Settings, Save, Shield, Building2, Users } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure platform settings and preferences</p>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center mb-6">
          <Settings className="w-6 h-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Platform Name</label>
              <input 
                type="text"
                defaultValue="Profeild" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Admin Email</label>
              <input 
                type="email"
                defaultValue="trilokiindoriya@gmail.com" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Platform Description</label>
            <textarea 
              rows={3}
              defaultValue="The most trusted marketplace for buying and selling properties" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>

      {/* User Management Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Auto-approve new users</h4>
              <p className="text-sm text-gray-500">Automatically verify new user accounts</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              Disabled
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Require document verification</h4>
              <p className="text-sm text-gray-500">Users must upload documents to list properties</p>
            </div>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
              Enabled
            </button>
          </div>
        </div>
      </div>

      {/* Property Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-6">
          <Building2 className="w-6 h-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Property Management</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Auto-approve properties</h4>
              <p className="text-sm text-gray-500">Automatically approve property listings</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              Disabled
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Require property documents</h4>
              <p className="text-sm text-gray-500">Properties must have legal documents</p>
            </div>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
              Enabled
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}