// worktracker-admin/src/pages/CarouselOffers.tsx
import React, { useState, useEffect, useRef } from 'react';
// import api from '../services/api';
import { carouselApi } from '../services/api';

interface CarouselOffer {
  id: string;
  title: string;
  imageUrl: string;
  actualPrice: number | null;
  offerPrice: number | null;
  pointsRequired: number | null;
  offerType: 'points_only' | 'cash_only' | 'combo' | 'free';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const OFFER_TYPES = [
  { value: 'points_only', label: '🏷️ Points Only',  desc: 'e.g. 200 pts → FREE' },
  { value: 'cash_only',   label: '💵 Cash Only',    desc: 'e.g. Just ₹65' },
  { value: 'combo',       label: '🔀 Combo',         desc: 'e.g. 100 pts + ₹30' },
  { value: 'free',        label: '🎁 Free',           desc: 'No points, no cash' },
];

export default function CarouselOffers() {
  const [offers, setOffers]         = useState<CarouselOffer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const fileRef                     = useRef<HTMLInputElement>(null);
  const [editingOffer, setEditingOffer] = useState<CarouselOffer | null>(null);

  // Form state
  const [title, setTitle]                   = useState('');
  const [actualPrice, setActualPrice]       = useState('');
  const [offerPrice, setOfferPrice]         = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [offerType, setOfferType]           = useState<string>('points_only');
  const [expiresAt, setExpiresAt]           = useState('');
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState('');

  useEffect(() => { loadOffers(); }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
    //   const res = await api.get('/admin/carousel');
    const res = await carouselApi.getAll();

      setOffers(res.data.offers || []);
    } catch {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setTitle(''); setActualPrice(''); setOfferPrice('');
    setPointsRequired(''); setOfferType('points_only');
    setExpiresAt(''); setImageFile(null); setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim())  return setError('Title is required');
    if (!imageFile)     return setError('Image is required');
    if (!offerType)     return setError('Offer type is required');

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title',          title.trim());
      formData.append('offerType',      offerType);
      formData.append('image',          imageFile);
      if (actualPrice)    formData.append('actualPrice',    actualPrice);
      if (offerPrice)     formData.append('offerPrice',     offerPrice);
      if (pointsRequired) formData.append('pointsRequired', pointsRequired);
      if (expiresAt)      formData.append('expiresAt',      new Date(expiresAt).toISOString());

    //   await api.post('/admin/carousel', formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //   });
    await carouselApi.create(formData);

      setSuccess('✅ Offer created successfully!');
      resetForm();
      loadOffers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
    //   await api.patch(`/admin/carousel/${id}/toggle`);
    await carouselApi.toggle(id);

      loadOffers();
    } catch {
      setError('Failed to toggle offer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
    //   await api.delete(`/admin/carousel/${id}`);
    await carouselApi.delete(id);

      loadOffers();
    } catch {
      setError('Failed to delete offer');
    }
  };

  const handleEdit = (offer: CarouselOffer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setActualPrice(offer.actualPrice?.toString() || '');
    setOfferPrice(offer.offerPrice?.toString() || '');
    setPointsRequired(offer.pointsRequired?.toString() || '');
    setOfferType(offer.offerType);
    setExpiresAt(offer.expiresAt ? new Date(offer.expiresAt).toISOString().slice(0, 16) : '');
    setImagePreview(offer.imageUrl);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingOffer(null);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingOffer) return;
    if (!title.trim()) return setError('Title is required');

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title',     title.trim());
      formData.append('offerType', offerType);
      if (imageFile)      formData.append('image',          imageFile);
      if (actualPrice)    formData.append('actualPrice',    actualPrice);
      if (offerPrice)     formData.append('offerPrice',     offerPrice);
      if (pointsRequired) formData.append('pointsRequired', pointsRequired);
      if (expiresAt)      formData.append('expiresAt',      new Date(expiresAt).toISOString());

      await carouselApi.edit(editingOffer.id, formData);

      setSuccess('✅ Offer updated successfully!');
      setEditingOffer(null);
      resetForm();
      loadOffers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update offer');
    } finally {
      setSubmitting(false);
    }
  };

  const getOfferLabel = (offer: CarouselOffer) => {
    switch (offer.offerType) {
      case 'points_only': return `${offer.pointsRequired} pts → FREE`;
      case 'cash_only':   return `₹${offer.offerPrice}`;
      case 'combo':       return `${offer.pointsRequired} pts + ₹${offer.offerPrice}`;
      case 'free':        return 'FREE';
      default:            return '';
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 4 }}>🎠 Carousel Offers</h2>
      <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14 }}>
        Create product offers shown as a horizontal carousel on the app home screen.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── CREATE FORM ── */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>{editingOffer ? '✏️ Edit Offer' : '✨ Create New Offer'}</h3>

          {error   && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}

          {/* Image upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Offer Image *</label>
            <div
              style={{ ...s.imageUpload, ...(imagePreview ? { padding: 0, border: 'none' } : {}) }}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10 }} />
                : <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13 }}>Click to upload image</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>JPEG, PNG, WebP</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Title *</label>
            <input style={s.input} placeholder="e.g. Premium Hair Clips" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Offer Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Offer Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OFFER_TYPES.map(t => (
                <div
                  key={t.value}
                  style={{ ...s.typeCard, ...(offerType === t.value ? s.typeCardActive : {}) }}
                  onClick={() => setOfferType(t.value)}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Price fields — show based on offerType */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={s.label}>Actual Price (₹)</label>
              <input style={s.input} type="number" placeholder="e.g. 200" value={actualPrice} onChange={e => setActualPrice(e.target.value)} />
              <div style={s.hint}>Strikethrough price</div>
            </div>

            {(offerType === 'cash_only' || offerType === 'combo') && (
              <div>
                <label style={s.label}>Our Price (₹) *</label>
                <input style={s.input} type="number" placeholder="e.g. 65" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
              </div>
            )}

            {(offerType === 'points_only' || offerType === 'combo') && (
              <div>
                <label style={s.label}>Points Required *</label>
                <input style={s.input} type="number" placeholder="e.g. 200" value={pointsRequired} onChange={e => setPointsRequired(e.target.value)} />
              </div>
            )}
          </div>

          {/* Expires At */}
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Expires At (optional)</label>
            <input style={s.input} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editingOffer && (
              <button style={{ ...s.btn, backgroundColor: '#6B7280', flex: '0 0 auto', width: 'auto', padding: '12px 20px' }} onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
            <button style={{ ...s.btn, opacity: submitting ? 0.6 : 1, flex: 1 }} onClick={editingOffer ? handleUpdate : handleSubmit} disabled={submitting}>
              {submitting ? (editingOffer ? 'Updating...' : 'Creating...') : (editingOffer ? '💾 Update Offer' : '🚀 Create Offer')}
            </button>
          </div>
        </div>

        {/* ── OFFERS LIST ── */}
        <div>
          <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>📋 All Offers ({offers.length})</h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
          ) : offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              <div style={{ fontSize: 32 }}>🎠</div>
              <div style={{ marginTop: 8 }}>No offers yet. Create your first one!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {offers.map(offer => (
                <div key={offer.id} style={{ ...s.offerCard, opacity: offer.isActive ? 1 : 0.6 }}>
                  {/* Image */}
                  <div style={{ position: 'relative' }}>
                    <img src={offer.imageUrl} alt={offer.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '10px 10px 0 0' }} />
                    {/* Price overlay */}
                    <div style={s.overlay}>
                      {offer.actualPrice && (
                        <span style={s.actualPrice}>₹{offer.actualPrice}</span>
                      )}
                      <span style={s.offerLabel}>{getOfferLabel(offer)}</span>
                    </div>
                    {/* Active badge */}
                    <div style={{ ...s.badge, backgroundColor: offer.isActive ? '#10B981' : '#9CA3AF' }}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{offer.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
                      {OFFER_TYPES.find(t => t.value === offer.offerType)?.label}
                      {offer.expiresAt && ` • Expires ${new Date(offer.expiresAt).toLocaleDateString()}`}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={{ ...s.actionBtn, backgroundColor: '#EEF2FF', color: '#6366F1' }}
                        onClick={() => handleEdit(offer)}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...s.actionBtn, backgroundColor: offer.isActive ? '#FEF3C7' : '#D1FAE5', color: offer.isActive ? '#D97706' : '#059669' }}
                        onClick={() => handleToggle(offer.id)}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        style={{ ...s.actionBtn, backgroundColor: '#FEE2E2', color: '#DC2626' }}
                        onClick={() => handleDelete(offer.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  card:         { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 },
  cardTitle:    { fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 },
  label:        { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  hint:         { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  input:        { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' },
  imageUpload:  { width: '100%', height: 180, border: '2px dashed #E5E7EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', boxSizing: 'border-box' as const },
  typeCard:     { padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all 0.15s' },
  typeCardActive:{ border: '2px solid #6366F1', backgroundColor: '#EEF2FF' },
  btn:          { width: '100%', padding: '12px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  error:        { backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  success:      { backgroundColor: '#D1FAE5', color: '#059669', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  offerCard:    { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' },
  overlay:      { position: 'absolute' as const, bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 10px 8px', display: 'flex', alignItems: 'center', gap: 8 },
  actualPrice:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'line-through' },
  offerLabel:   { color: '#fff', fontWeight: 700, fontSize: 14 },
  badge:        { position: 'absolute' as const, top: 8, right: 8, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  actionBtn:    { flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' },
};
