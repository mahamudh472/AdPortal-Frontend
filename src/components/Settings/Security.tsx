import React, { useState } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";
import type { PasswordForm } from "../../types/security";
import Swal from "sweetalert2";

const Security: React.FC = () => {
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdatePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        old_password: form.currentPassword,
        new_password: form.newPassword,
        confirm_password: form.confirmPassword,
      };

      const response = await api.post("/accounts/change-password/", payload);

      toast.success("Password Changed successfully");
      console.log(response);

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      
      if (error.response?.data) {
        const errorMessage = error.response.data.message || 
                            error.response.data.error || 
                            "Failed to update password";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleDeleteAccount = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Once you delete your account, there is no going back. All your data will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      input: "password",
      inputLabel: "Enter your password to confirm",
      inputPlaceholder: "Password",
      inputAttributes: { autocapitalize: "off", autocomplete: "current-password" },
      inputValidator: (value) => (!value ? "Password is required" : undefined),
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#ffffff",
      color: "#1e293b",
      iconColor: "#dc2626",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleteLoading(true);
        
        try {
          await api.delete("/accounts/delete-account/", {
            data: { password: result.value },
          });
          
          Swal.fire({
            title: "Account Deleted!",
            text: "Your account has been successfully deleted.",
            icon: "success",
            confirmButtonColor: "#3085d6",
            background: "#ffffff",
            color: "#1e293b",
          }).then(() => {
            window.location.href = "/auth/signin";
          });
          
        } catch (error: any) {
          console.error("Error deleting account:", error);
          
          Swal.fire({
            title: "Error",
            text: error.response?.data?.error || error.response?.data?.message || "Failed to delete account. Please try again.",
            icon: "error",
            confirmButtonColor: "#3085d6",
            background: "#ffffff",
            color: "#1e293b",
          });
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  return (
    <div className="rounded-xl bg-white  space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">
              Current Password
            </label>
            <div className="relative mt-1">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                placeholder="Enter current password"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
            )}
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="border-t pt-6" />

      <div>
        <p className="text-sm font-medium text-red-600 mb-3">
          Danger Zone
        </p>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Delete Account
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Once you delete your account, there is no going back.
            Please be certain.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleteLoading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
            ) : (
              <Trash2 size={14} />
            )}
            {deleteLoading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Security;