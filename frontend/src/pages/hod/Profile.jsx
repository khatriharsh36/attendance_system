import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { User, Mail, Building, Shield, CheckCircle } from 'lucide-react';

export const HODProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Department Head Profile"
        subtitle="Executive administrative identity for academic operations at MITAOE."
      />

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        {/* Banner */}
        <div className="bg-navy p-6 text-surface border-b border-navy-light flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-academic text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm">
            {user?.name?.slice(0, 2) || 'HD'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-brandText-muted mt-1">
              <span className="font-mono bg-navy-light px-2 py-0.5 rounded text-white font-semibold">
                ID: {user?.facultyId || 'HOD-EMP-01'}
              </span>
              <span>•</span>
              <span className="text-academic-light font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Department Head
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-brandText-secondary uppercase tracking-wider block mb-1">
                Official Email
              </label>
              <div className="flex items-center gap-2 text-navy font-medium">
                <Mail className="w-4 h-4 text-academic" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-brandText-secondary uppercase tracking-wider block mb-1">
                Administered Department
              </label>
              <div className="flex items-center gap-2 text-navy font-medium">
                <Building className="w-4 h-4 text-academic" />
                <span>{user?.department}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-brandText-secondary uppercase tracking-wider block mb-1">
                System Administrative Role
              </label>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-subtle border border-border text-xs font-semibold uppercase tracking-wider text-navy">
                <Shield className="w-3.5 h-3.5 text-academic" />
                <span>Head of Department (HOD)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-brandText-secondary uppercase tracking-wider block mb-1">
                Administrative Permissions
              </label>
              <div className="text-xs text-brandText-secondary leading-relaxed">
                Course provisioning, faculty workload assignment, master timetable governance, and departmental attendance compliance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
