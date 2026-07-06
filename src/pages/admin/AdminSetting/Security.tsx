import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

const Security: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!currentPassword) {
      toast.error("Current password is required");
      return false;
    }

    if (!newPassword) {
      toast.error("New password is required");
      return false;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return false;
    }

    if (!confirmPassword) {
      toast.error("Please confirm your new password");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/accounts/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.status === 200) {
        toast.success("Password changed successfully!");

        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Reset visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error: any) {
      console.error("Password change error:", error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.old_password) {
          toast.error(errorData.old_password[0] || "Current password is incorrect");
        } else if (errorData.new_password) {
          toast.error(errorData.new_password[0] || "Invalid new password");
        } else if (errorData.confirm_password) {
          toast.error(errorData.confirm_password[0] || "Password confirmation failed");
        } else if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors[0] || "Failed to change password");
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        } else {
          toast.error("Failed to change password. Please try again.");
        }
      } else {
        toast.error("Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Change Password
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Update your account password to remain secure
        </p>
      </div>

      <div className="space-y-4 text-xs font-semibold text-slate-500">
        {/* Current Password */}
        <div>
          <label className="mb-1.5 block">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all pr-10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showCurrentPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="mb-1.5 block">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all pr-10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-semibold leading-none">Must be at least 6 characters long</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all pr-10 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{loading ? "Updating..." : "Update Password"}</span>
        </button>
      </div>

      {/* Password Requirements Info */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-xs font-bold text-slate-900 mb-2">Password Requirements</h3>
        <ul className="text-xs text-slate-400 font-semibold space-y-1.5 list-disc list-inside">
          <li>At least 6 characters long</li>
          <li>Should be different from your current password</li>
          <li>Use a mix of letters, numbers, and symbols for better security</li>
        </ul>
      </div>
    </form>
  );
};

export default Security;