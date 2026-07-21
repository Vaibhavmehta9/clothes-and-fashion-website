import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !businessEmail || !businessPhone || !addressLine1 || !city || !state || !pincode) {
      toast.error('Please enter all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/vendors/register', {
        storeName,
        storeDescription,
        businessEmail,
        businessPhone,
        gstNumber,
        address: {
          addressLine1,
          city,
          state,
          pincode,
        },
      });
      toast.success('Application submitted. Awaiting approval.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col gap-6 my-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold">Sell on StyleVerse</h2>
        <p className="text-muted-foreground text-sm">
          Join our premium marketplace network. Set up your storefront, manage shipping, and build your brand.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Store / Brand Name *</label>
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Store Description</label>
          <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="input-field h-24" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Business Email Address *</label>
          <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Business Phone Number *</label>
          <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="input-field" required />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">GSTIN Number (Optional)</label>
          <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className="input-field" />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Business Address *</label>
          <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">City *</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">State *</label>
          <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Pincode *</label>
          <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="input-field" required />
        </div>

        <button type="submit" className="btn-primary py-3.5 rounded-xl md:col-span-2 font-semibold mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Application...' : 'Register Store'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
