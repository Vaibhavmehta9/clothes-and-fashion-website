import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data.data);
    } catch {
      toast.error('Failed to fetch addresses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/addresses', { name, phone, addressLine1, city, state, pincode });
      toast.success('Address added successfully.');
      setShowAddForm(false);
      setName('');
      setPhone('');
      setAddressLine1('');
      setCity('');
      setState('');
      setPincode('');
      fetchAddresses();
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        const errorMessages = Object.values(responseData.errors).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(responseData?.message || 'Failed to add address.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted.');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Shipping Addresses</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary py-2 px-4 text-xs rounded-xl"
        >
          {showAddForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAddress} className="bg-card border border-border p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm max-w-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Recipient Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Phone Number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" required />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold">Address Line 1 *</label>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Pincode *</label>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn-primary py-3 rounded-xl md:col-span-2 font-semibold mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr._id} className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-sm mb-2">{addr.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {addr.addressLine1}, {addr.city}, {addr.state} – {addr.pincode}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Phone: {addr.phone}</p>
            </div>
            <div className="flex justify-end mt-4 border-t border-border pt-4">
              <button
                onClick={() => handleDelete(addr._id)}
                className="text-xs text-red-500 font-semibold hover:underline"
              >
                Delete Address
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressesPage;
