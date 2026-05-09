

import React, { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import { toast } from "sonner";
import { Camera } from "lucide-react";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dqkczdjjs/image/upload/v1773093792/avatar-profile-icon-in-flat-style-male-user-profile-illustration-on-isolated-background-man-profile-sign-business-concept-vector_ufimxp.jpg";

interface ProfileForm {
  full_name: string;
  email: string;
  phone_number: string;
  avatar: string | File | null;
}

const Profile: React.FC = () => {
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    phone_number: "",
    avatar: null
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [initialForm, setInitialForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    phone_number: "",
    avatar: null
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const response = await api.get("/accounts/profile");
      
      const profileData = {
        full_name: response.data.full_name || "",
        email: response.data.email || "",
        phone_number: response.data.phone_number || "",
        avatar: response.data.avatar || null
      };
      
      setForm(profileData);
      setInitialForm(profileData);
      setAvatarPreview(response.data.avatar || null);
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("full_name", form.full_name);
      formData.append("phone_number", form.phone_number);
      
      if (form.avatar instanceof File) {
        formData.append("avatar", form.avatar);
      }

      const response = await api.patch("/accounts/profile/update/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Profile updated successfully:", response.data);
      toast.success("Profile updated successfully!");
      
      const updatedProfile = {
        full_name: response.data.full_name || form.full_name,
        email: form.email,
        phone_number: response.data.phone_number || form.phone_number,
        avatar: response.data.avatar || form.avatar
      };
      
      setForm(updatedProfile);
      setInitialForm(updatedProfile);
      setEditing(false);
      
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profile update failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setAvatarPreview(typeof initialForm.avatar === 'string' ? initialForm.avatar : null);
    setEditing(false);
  };

  const hasChanges = () => {
    return form.full_name !== initialForm.full_name || 
           form.phone_number !== initialForm.phone_number ||
           form.avatar !== initialForm.avatar;
  };

  if (fetching) {
    return (
      <div className="rounded-xl bg-white ">
        <div className="flex justify-center items-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white ">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-slate-900">
          Personal Information
        </h2>
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center sm:flex-row sm:items-end gap-5">
          <div className="relative group">
            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200">
              <img
                src={avatarPreview || DEFAULT_AVATAR}
                alt="Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            {editing && (
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="text-center sm:text-left pb-1">
            <h3 className="text-sm font-medium text-slate-900">Profile Photo</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload a professional photo to personalize your account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              disabled={!editing}
              placeholder="Enter your full name"
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              disabled={!editing}
              placeholder="Enter your phone number"
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">
            Email address cannot be changed
          </p>
        </div>
      </div>

      {editing && (
        <>
          <div className="my-6 border-t" />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !hasChanges()}
              className={`rounded-lg px-5 cursor-pointer py-2 text-sm font-medium transition flex items-center gap-2 ${
                hasChanges() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;