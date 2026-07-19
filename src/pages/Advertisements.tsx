// worktracker-admin/src/pages/Advertisements.tsx
import React, { useState, useEffect, useRef } from 'react';
import { sponsorApi, areaApi } from '../services/api';

interface Sponsor {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  cardType: 'banner' | 'text' | 'full';
  areaId: string | null;
  placement: 'home' | 'community' | 'tasks' | 'activity' | 'both';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const CARD_TYPES = [
  { value: 'banner', label: '🖼️ Banner Only', desc: 'Image only — no text' },
  { value: 'text',   label: '📝 Text Only',   desc: 'Title + description + contact' },
  { value: 'full',   label: '✨ Full Card',    desc: 'Image + title + description + contact' },
];

const PLACEMENT_TYPES = [
  { value: 'home',      label: '🏠 Home' },
  { value: 'community', label: '👥 Community' },
  { value: 'tasks',     label: '✅ Tasks' },
  { value: 'activity',  label: '📊 Activity' },
  { value: 'both',      label: '✨ All Screens' },
];

export default function Advertisements() {
  const [sponsors, setSponsors]             = useState<Sponsor[]>([]);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const logoRef  = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [phone, setPhone]               = useState('');
  const [website, setWebsite]           = useState('');
  const [address, setAddress]           = useState('');
  const [cardType, setCardType]         = useState<string>('banner');
  const [placement, setPlacement]       = useState<string>('home');
  const [areaId, setAreaId]             = useState<string>('');
  const [areaSearch, setAreaSearch]     = useState<string>('');
  const [areas, setAreas]               = useState<{ id: string; name: string }[]>([]);
  const [areaLoading, setAreaLoading]   = useState(false);
  const [expiresAt, setExpiresAt]       = useState('');
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [logoPreview, setLogoPreview]   = useState('');

  useEffect(() => { loadSponsors(); loadAreas(); }, []);

  const loadAreas = async () => {
    try {
      const res = await areaApi.getAll();
      setAreas(res.data.areas || []);
    } catch {}
  };

  const searchAreas = async (q: string) => {
    setAreaSearch(q);
    if (!q.trim()) { loadAreas(); return; }
    try {
      setAreaLoading(true);
      const res = await areaApi.search(q);
      setAreas(res.data.areas || []);
    } catch {}
    finally { setAreaLoading(false); }
  };

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const res = await sponsorApi.getAll();
      setSponsors(res.data.sponsors || []);
    } catch {
      setError('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPhone('');
    setWebsite(''); setAddress(''); setCardType('banner');
    setPlacement('home'); setAreaId(''); setAreaSearch('');
    setExpiresAt(''); setImageFile(null); setLogoFile(null);
    setImagePreview(''); setLogoPreview('');
    setEditingSponsor(null);
    if (imageRef.current) imageRef.current.value = '';
    if (logoRef.current)  logoRef.current.value  = '';
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setTitle(sponsor.title || '');
    setDescription(sponsor.description || '');
    setPhone(sponsor.phone || '');
    setWebsite(sponsor.website || '');
    setAddress(sponsor.address || '');
    setCardType(sponsor.cardType);
    setPlacement(sponsor.placement || 'home');
    setAreaId(sponsor.areaId || '');
    setAreaSearch('');
    setExpiresAt(sponsor.expiresAt ? new Date(sponsor.expiresAt).toISOString().slice(0, 16) : '');
    setImagePreview(sponsor.imageUrl || '');
    setLogoPreview(sponsor.logoUrl || '');
    setImageFile(null);
    setLogoFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('cardType',  cardType);
    formData.append('placement', placement);
    if (areaId)      formData.append('areaId',     areaId);
    if (title)       formData.append('title',       title.trim());
    if (description) formData.append('description', description.trim());
    if (phone)       formData.append('phone',       phone.trim());
    if (website)     formData.append('website',     website.trim());
    if (address)     formData.append('address',     address.trim());
    if (expiresAt)   formData.append('expiresAt',   new Date(expiresAt).toISOString());
    if (imageFile)   formData.append('image',       imageFile);
    if (logoFile)    formData.append('logo',        logoFile);
    return formData;
  };

  const handleSubmit = async () => {
    if (cardType !== 'banner' && !title.trim()) return setError('Title is required for text and full cards');
    if ((cardType === 'banner' || cardType === 'full') && !imageFile && !imagePreview) return setError('Image is required for banner and full cards');
    try {
      setSubmitting(true);
      setError('');
      await sponsorApi.create(buildFormData());
      setSuccess('✅ Advertisement created successfully!');
      resetForm();
      loadSponsors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create advertisement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSponsor) return;
    if (cardType !== 'banner' && !title.trim()) return setError('Title is required for text and full cards');
    try {
      setSubmitting(true);
      setError('');
      await sponsorApi.edit(editingSponsor.id, buildFormData());
      setSuccess('✅ Advertisement updated successfully!');
      resetForm();
      loadSponsors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update advertisement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await sponsorApi.toggle(id);
      loadSponsors();
    } catch {
      setError('Failed to toggle advertisement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this advertisement?')) return;
    try {
      await sponsorApi.delete(id);
      loadSponsors();
    } catch {
      setError('Failed to delete advertisement');
    }
  };

  const cardTypeLabel  = (ct: string) => CARD_TYPES.find(t => t.value === ct)?.label || ct;
  const placementLabel = (p: string)  => PLACEMENT_TYPES.find(t => t.value === p)?.label || p;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 4 }}>📢 Advertisements</h2>
      <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14 }}>
        Manage sponsored cards shown on the app home screen.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── FORM ── */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>{editingSponsor ? '✏️ Edit Advertisement' : '✨ Create New Advertisement'}</h3>

          {error   && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}

          {/* Card Type */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Card Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {CARD_TYPES.map(t => (
                <div
                  key={t.value}
                  style={{ ...s.typeCard, ...(cardType === t.value ? s.typeCardActive : {}) }}
                  onClick={() => setCardType(t.value)}
                >
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Target Area */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Target Area (optional)</label>
            <input
              style={s.input}
              placeholder="Search area e.g. Tarnaka..."
              value={areaSearch}
              onChange={e => searchAreas(e.target.value)}
            />
            {areaSearch.length > 0 && areas.length > 0 && (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: 'auto', background: '#fff', zIndex: 10, position: 'relative' }}>
                {areaLoading && <div style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 13 }}>Searching...</div>}
                {areas.map(a => (
                  <div
                    key={a.id}
                    onClick={() => { setAreaId(a.id); setAreaSearch(a.name); setAreas([]); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F3F4F6', background: areaId === a.id ? '#EEF2FF' : '#fff', color: areaId === a.id ? '#6366F1' : '#111827' }}
                  >
                    📍 {a.name}
                  </div>
                ))}
              </div>
            )}
            {areaId && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#6366F1' }}>
                ✅ Selected: <strong>{areaSearch}</strong>
                <span style={{ marginLeft: 8, cursor: 'pointer', color: '#EF4444' }} onClick={() => { setAreaId(''); setAreaSearch(''); loadAreas(); }}>
                  ✕ Clear
                </span>
              </div>
            )}
          </div>

          {/* Placement */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Show On *</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLACEMENT_TYPES.map(p => (
                <div
                  key={p.value}
                  onClick={() => setPlacement(p.value)}
                  style={{
                    flex: 1, minWidth: 70, padding: '8px 4px', borderRadius: 8,
                    border: placement === p.value ? '2px solid #6366F1' : '1px solid #E5E7EB',
                    backgroundColor: placement === p.value ? '#EEF2FF' : '#fff',
                    cursor: 'pointer', textAlign: 'center' as const, fontSize: 11,
                    fontWeight: placement === p.value ? 700 : 400,
                    color: placement === p.value ? '#6366F1' : '#6B7280',
                  }}
                >
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {/* Banner Image — show for banner + full */}
          {(cardType === 'banner' || cardType === 'full') && (
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Banner Image *</label>
              <div
                style={{ ...s.imageUpload, ...(imagePreview ? { padding: 0, border: 'none' } : {}) }}
                onClick={() => imageRef.current?.click()}
              >
                {imagePreview
                  ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10 }} />
                  : <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                      <div style={{ fontSize: 13 }}>Click to upload banner</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>JPEG, PNG, WebP</div>
                    </div>
                }
              </div>
              <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
            </div>
          )}

          {/* Text fields — show for text + full */}
          {(cardType === 'text' || cardType === 'full') && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Title *</label>
                <input style={s.input} placeholder="e.g. Little Hearts Play School" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, height: 70, resize: 'vertical' as const }} placeholder="Short tagline or summary..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </>
          )}

          {/* Logo */}
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Logo (optional — small icon/logo)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{ width: 60, height: 60, border: '2px dashed #E5E7EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                onClick={() => logoRef.current?.click()}
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22 }}>🏷️</span>
                }
              </div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Click to upload logo</span>
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }} />
          </div>

          {/* Contact fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Phone (tap to call)</label>
              <input style={s.input} placeholder="e.g. 9985886965" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Website (tap to open)</label>
              <input style={s.input} placeholder="e.g. https://..." value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Address</label>
            <input style={s.input} placeholder="e.g. Near Sunday Market, Tarnaka" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Expires At (optional)</label>
            <input style={s.input} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editingSponsor && (
              <button style={{ ...s.btn, backgroundColor: '#6B7280', flex: '0 0 auto', width: 'auto', padding: '12px 20px' }} onClick={resetForm}>
                Cancel
              </button>
            )}
            <button style={{ ...s.btn, opacity: submitting ? 0.6 : 1, flex: 1 }} onClick={editingSponsor ? handleUpdate : handleSubmit} disabled={submitting}>
              {submitting ? (editingSponsor ? 'Updating...' : 'Creating...') : (editingSponsor ? '💾 Update' : '🚀 Go Live')}
            </button>
          </div>
        </div>

        {/* ── LIST ── */}
        <div>
          <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>📋 All Advertisements ({sponsors.length})</h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
          ) : sponsors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              <div style={{ fontSize: 32 }}>📢</div>
              <div style={{ marginTop: 8 }}>No advertisements yet. Create your first one!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sponsors.map(sponsor => (
                <div key={sponsor.id} style={{ ...s.sponsorCard, opacity: sponsor.isActive ? 1 : 0.6 }}>

                  {sponsor.imageUrl && (
                    <div style={{ position: 'relative' }}>
                      <img src={sponsor.imageUrl} alt={sponsor.title || 'ad'} style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: '10px 10px 0 0', backgroundColor: '#F9FAFB' }} />
                      <div style={{ ...s.badge, backgroundColor: sponsor.isActive ? '#10B981' : '#9CA3AF' }}>
                        {sponsor.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div style={{ ...s.badge, left: 8, right: 'auto', backgroundColor: '#6366F1' }}>
                        {cardTypeLabel(sponsor.cardType)}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '12px 14px' }}>
                    {!sponsor.imageUrl && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: 20 }}>{cardTypeLabel(sponsor.cardType)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: sponsor.isActive ? '#10B981' : '#9CA3AF', background: sponsor.isActive ? '#D1FAE5' : '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>{sponsor.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    )}

                    {sponsor.logoUrl && (
                      <img src={sponsor.logoUrl} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', marginBottom: 6 }} />
                    )}

                    {sponsor.title       && <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{sponsor.title}</div>}
                    {sponsor.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{sponsor.description}</div>}

                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
                      {sponsor.phone     && <span style={{ marginRight: 10 }}>📞 {sponsor.phone}</span>}
                      {sponsor.website   && <span style={{ marginRight: 10 }}>🌐 website</span>}
                      {sponsor.address   && <span>📍 {sponsor.address}</span>}
                      {sponsor.expiresAt && <span style={{ display: 'block', marginTop: 4 }}>Expires {new Date(sponsor.expiresAt).toLocaleDateString()}</span>}
                      {sponsor.placement && (
                        <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 20 }}>
                          {placementLabel(sponsor.placement)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...s.actionBtn, backgroundColor: '#EEF2FF', color: '#6366F1' }} onClick={() => handleEdit(sponsor)}>Edit</button>
                      <button
                        style={{ ...s.actionBtn, backgroundColor: sponsor.isActive ? '#FEF3C7' : '#D1FAE5', color: sponsor.isActive ? '#D97706' : '#059669' }}
                        onClick={() => handleToggle(sponsor.id)}
                      >
                        {sponsor.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button style={{ ...s.actionBtn, backgroundColor: '#FEE2E2', color: '#DC2626' }} onClick={() => handleDelete(sponsor.id)}>Delete</button>
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
  card:          { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 },
  cardTitle:     { fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 },
  label:         { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:         { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none' },
  imageUpload:   { width: '100%', height: 160, border: '2px dashed #E5E7EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', boxSizing: 'border-box' as const },
  typeCard:      { padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer' },
  typeCardActive:{ border: '2px solid #6366F1', backgroundColor: '#EEF2FF' },
  btn:           { width: '100%', padding: '12px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  error:         { backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  success:       { backgroundColor: '#D1FAE5', color: '#059669', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  sponsorCard:   { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' },
  badge:         { position: 'absolute' as const, top: 8, right: 8, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  actionBtn:     { flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' },
};