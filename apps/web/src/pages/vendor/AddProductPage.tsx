import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [color, setColor] = useState('Black');
  const [size, setSize] = useState('M');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.data.data);
        setBrands(brandRes.data.data);
        if (catRes.data.data.length > 0) setCategoryId(catRes.data.data[0]._id);
        if (brandRes.data.data.length > 0) setBrandId(brandRes.data.data[0]._id);
      } catch {
        toast.error('Failed to load category/brand details.');
      }
    };
    fetchMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !mrp || !imageUrl) {
      toast.error('Please enter all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/products', {
        name,
        description,
        shortDescription,
        category: categoryId,
        brand: brandId,
        images: [imageUrl],
        thumbnail: imageUrl,
        variants: [
          {
            color,
            colorCode: '#000000',
            size,
            price: Number(price),
            mrp: Number(mrp),
            stock: Number(stock),
          },
        ],
      });
      toast.success('Listing created successfully.');
      navigate('/vendor/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col gap-6">
      <h2 className="text-2xl font-display font-bold">Add New Product</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Product Title *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Short Description</label>
          <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="input-field" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold">Full Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-24" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Category *</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Brand *</label>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input-field">
            {brands.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Sell Price (INR) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">MRP Price (INR) *</label>
          <input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} className="input-field" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Color Variant</label>
          <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="input-field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Size Variant</label>
          <input type="text" value={size} onChange={(e) => setSize(e.target.value)} className="input-field" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Stock Quantity</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input-field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold">Image URL *</label>
          <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field" required />
        </div>

        <button type="submit" className="btn-primary py-3.5 rounded-xl md:col-span-2 font-semibold mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Listing...' : 'Submit Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductPage;
