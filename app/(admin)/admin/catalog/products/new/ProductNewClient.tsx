'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import {
  ProductGalleryEditor,
  type ProductGalleryFrame,
} from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import type { AdminCuratedCollectionRow } from '../../../collections/collectionsAdminTypes';
import type { AdminProductSetRow } from '../../../product-sets/productSetsAdminTypes';
import type { AdminBrandRow } from '../../../brands/adminBrandTypes';
import type { AdminCategoryRow } from '../../categories/adminCategoryTypes';
import type {
  AdminProductVariantSummary,
  AdminCatalogTagRow,
  ProductAdminDetail,
} from '../adminProductTypes';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminPillBadge, AdminPillChip, AdminPillChipList } from '@/components/AdminPillChip/AdminPillChip';
import { AdminSelect, AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import {
  adminBackendJson,
  adminUploadRichMedia,
  revalidatePublicCatalogCache,
} from '@/lib/adminBackendFetch';
import { adminBackendListAll } from '@/lib/adminListResponse';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import { adminProductNewStrings } from '@/lib/admin-i18n/adminProductNewI18n';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../catalogAdmin.module.css';
import objStyles from '../../../objects/objectsLibrary.module.css';
import pn from './productNew.module.css';
import { ProductElementsSection } from './ProductElementsSection';
import { ProductModificationsSection } from './ProductModificationsSection';

function rowId() {
  return createClientRandomId();
}

export function ProductFormClient({ productId }: { productId?: string } = {}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductNewStrings(locale), [locale]);
  const galleryStr = useMemo(() => adminProductGalleryEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!productId;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [productLoaded, setProductLoaded] = useState(!productId);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [curatedCollections, setCuratedCollections] = useState<AdminCuratedCollectionRow[]>([]);
  const [productSets, setProductSets] = useState<AdminProductSetRow[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [additionalCatPick, setAdditionalCatPick] = useState('');
  const [curatedCollectionIds, setCuratedCollectionIds] = useState<Set<string>>(() => new Set());
  const [collectionPick, setCollectionPick] = useState('');
  const [curatedProductSetIds, setCuratedProductSetIds] = useState<Set<string>>(() => new Set());
  const [productSetPick, setProductSetPick] = useState('');
  const [catalogTags, setCatalogTags] = useState<AdminCatalogTagRow[]>([]);
  const [catalogTagIds, setCatalogTagIds] = useState<Set<string>>(() => new Set());
  const [catalogTagPick, setCatalogTagPick] = useState('');
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [gallery, setGallery] = useState<ProductGalleryFrame[]>([]);
  const [deliveryText, setDeliveryText] = useState('');
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [additionalInfoHtml, setAdditionalInfoHtml] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [likesAdminBoost, setLikesAdminBoost] = useState(0);

  const [product, setProduct] = useState<ProductAdminDetail | null>(null);
  const [variants, setVariants] = useState<AdminProductVariantSummary[]>([]);
  const [variantCreateOpen, setVariantCreateOpen] = useState(false);
  const [variantCreateModificationId, setVariantCreateModificationId] = useState('');
  const [variantCreateBusy, setVariantCreateBusy] = useState(false);
  const [variantCreateError, setVariantCreateError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<null | { filter: 'image' | 'video'; title: string }>(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);

  const applyProduct = useCallback((p: ProductAdminDetail) => {
    setProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.categoryId);
    setAdditionalCategoryIds(new Set(p.additionalCategoryIds ?? []));
    setCuratedCollectionIds(new Set(p.curatedCollectionIds ?? []));
    setCuratedProductSetIds(new Set(p.curatedProductSetIds ?? []));
    setCatalogTagIds(new Set(p.catalogTagIds ?? []));
    setBrandId(p.brandId ?? '');
    setShortDescription(p.shortDescription ?? '');
    setIsActive(p.isActive);
    setGallery(
      p.images.map((img) => ({
        id: rowId(),
        url: img.url,
        serverId: img.id,
      })),
    );
    setVariants(p.variants ?? []);
    setDeliveryText(p.deliveryText ?? '');
    setTechnicalSpecs(p.technicalSpecs ?? '');
    setAdditionalInfoHtml(p.additionalInfoHtml ?? '');
    setSeoTitle(p.seoTitle ?? '');
    setSeoDescription(p.seoDescription ?? '');
    setLikesAdminBoost(typeof p.likesAdminBoost === 'number' ? p.likesAdminBoost : 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      if (productId) setProductLoaded(false);
      try {
        const [cats, brs, cols, sets, tags] = await Promise.all([
          adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories'),
          adminBackendListAll<AdminBrandRow>('catalog/admin/brands'),
          adminBackendListAll<AdminCuratedCollectionRow>('catalog/admin/curated-collections'),
          adminBackendListAll<AdminProductSetRow>('catalog/admin/product-sets'),
          adminBackendJson<AdminCatalogTagRow[]>('catalog/admin/catalog-tags?all=1'),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);
        setCuratedCollections(cols);
        setProductSets(sets);
        setCatalogTags(tags);

        if (productId) {
          const p = await adminBackendJson<ProductAdminDetail>(`catalog/admin/products/${productId}`);
          if (cancelled) return;
          applyProduct(p);
        }
        if (!cancelled) setProductLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : s.errLoadData);
          if (productId) setProductLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, applyProduct, s]);

  useEffect(() => {
    if (!categoryId) return;
    setAdditionalCategoryIds((prev) => {
      if (!prev.has(categoryId)) return prev;
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }, [categoryId]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const la = a.parent ? `${a.parent.name} ${a.name}` : a.name;
      const lb = b.parent ? `${b.parent.name} ${b.name}` : b.name;
      return la.localeCompare(lb, locale === 'zh' ? 'zh' : 'ru');
    });
  }, [categories, locale]);

  const categoriesAvailableForAdditional = useMemo(() => {
    if (!categoryId) return [];
    return sortedCategories.filter(
      (c) => c.id !== categoryId && !additionalCategoryIds.has(c.id),
    );
  }, [sortedCategories, categoryId, additionalCategoryIds]);

  const productCollections = useMemo(
    () => curatedCollections.filter((c) => c.kind === 'PRODUCT'),
    [curatedCollections],
  );

  const collectionsAvailableForPick = useMemo(
    () => productCollections.filter((c) => !curatedCollectionIds.has(c.id)),
    [productCollections, curatedCollectionIds],
  );

  const setsAvailableForPick = useMemo(
    () => productSets.filter((setRow) => !curatedProductSetIds.has(setRow.id)),
    [productSets, curatedProductSetIds],
  );

  const catalogTagsAvailableForPick = useMemo(
    () => catalogTags.filter((t) => !catalogTagIds.has(t.id)),
    [catalogTags, catalogTagIds],
  );

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? s.pickerVideo : s.pickerImage,
        });
      }),
    [s],
  );

  function handlePickerPick(sel: { url: string; id: string }) {
    const rich = richPickResolver.current;
    if (!rich) return;
    richPickResolver.current = null;
    rich(sel.url);
    setPicker(null);
  }

  function addAdditionalCategoryFromDropdown(catId: string) {
    if (!catId || catId === categoryId || additionalCategoryIds.has(catId)) return;
    setAdditionalCategoryIds((prev) => new Set(prev).add(catId));
    setAdditionalCatPick('');
  }

  function removeAdditionalCategory(catId: string) {
    setAdditionalCategoryIds((prev) => {
      const next = new Set(prev);
      next.delete(catId);
      return next;
    });
  }

  function addCatalogTagFromDropdown(tagId: string) {
    if (!tagId || catalogTagIds.has(tagId)) return;
    setCatalogTagIds((prev) => new Set(prev).add(tagId));
    setCatalogTagPick('');
  }

  function removeCatalogTag(tagId: string) {
    setCatalogTagIds((prev) => {
      const next = new Set(prev);
      next.delete(tagId);
      return next;
    });
  }

  function addCuratedCollectionFromDropdown(colId: string) {
    if (!colId || curatedCollectionIds.has(colId)) return;
    setCuratedCollectionIds((prev) => new Set(prev).add(colId));
    setCollectionPick('');
  }

  function removeCuratedCollection(colId: string) {
    setCuratedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(colId);
      return next;
    });
  }

  function addProductSetFromDropdown(setId: string) {
    if (!setId || curatedProductSetIds.has(setId)) return;
    setCuratedProductSetIds((prev) => new Set(prev).add(setId));
    setProductSetPick('');
  }

  function removeProductSet(setId: string) {
    setCuratedProductSetIds((prev) => {
      const next = new Set(prev);
      next.delete(setId);
      return next;
    });
  }

  function categoryLabel(c: AdminCategoryRow): string {
    return c.parent ? `${c.parent.name} → ${c.name}` : c.name;
  }

  function openVariantCreateModal() {
    setVariantCreateError(null);
    const firstModId = product?.modifications[0]?.id ?? '';
    setVariantCreateModificationId(firstModId);
    setVariantCreateOpen(true);
  }

  async function createVariant() {
    if (!productId) return;
    if (!variantCreateModificationId) {
      setVariantCreateError(s.variantModsFirst);
      return;
    }
    setVariantCreateBusy(true);
    setVariantCreateError(null);
    try {
      const { id } = await adminBackendJson<{ id: string }>(
        `catalog/admin/products/${productId}/variants`,
        {
          method: 'POST',
          body: JSON.stringify({ modificationId: variantCreateModificationId }),
        },
      );
      setVariantCreateOpen(false);
      router.push(`/admin/catalog/products/${productId}/variants/${id}`);
    } catch (e) {
      setVariantCreateError(e instanceof Error ? e.message : s.variantCreateErr);
    } finally {
      setVariantCreateBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (!categoryId) {
      setSaveError(s.errPickCategory);
      return;
    }
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError(s.errName);
      return;
    }

    const basePayload = {
      categoryId,
      additionalCategoryIds: Array.from(additionalCategoryIds),
      curatedCollectionIds: Array.from(curatedCollectionIds),
      curatedProductSetIds: Array.from(curatedProductSetIds),
      catalogTagIds: Array.from(catalogTagIds),
      brandId: brandId || null,
      name: nameTrim,
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim() || null,
      gallery: gallery
        .filter((g) => g.url.trim())
        .map((g) => ({
          ...(g.serverId ? { id: g.serverId } : {}),
          url: g.url.trim(),
          alt: null,
        })),
      deliveryText: deliveryText.trim() || null,
      technicalSpecs: technicalSpecs.trim() || null,
      additionalInfoHtml: additionalInfoHtml.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      isActive,
    };

    if (productId) {
      setSaving(true);
      try {
        const patchBody = { ...basePayload, likesAdminBoost };
        const updated = await adminBackendJson<ProductAdminDetail>(
          `catalog/admin/products/${productId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(patchBody),
          },
        );
        applyProduct(updated);
        await revalidatePublicCatalogCache();
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : s.saveErr);
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const created = await adminBackendJson<{ id: string }>('catalog/admin/products', {
        method: 'POST',
        body: JSON.stringify(basePayload),
      });
      await revalidatePublicCatalogCache();
      router.push(`/admin/catalog/products/${created.id}`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (productId && !productLoaded && !loadError) {
    return <p className={catalogStyles.muted}>{s.loadingProduct}</p>;
  }

  const normalizedBrandId = brandId || null;
  const canCreateVariant = !!product && product.modifications.length > 0;

  return (
    <>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      <form className={`${catalogStyles.form} ${pn.formWide}`} onSubmit={submit}>
        <div className={pn.productFormGrid}>
          <div className={pn.productFormMain}>
            <AdminTextField
              label={s.productName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
            />

            <AdminTextField
              label={s.slugOptional}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="latin-slug"
              autoComplete="off"
            />

            <AdminTextArea
              label={s.shortDesc}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={4}
            />

            <AdminSelect
              label={s.brand}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">{s.brandNone}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </AdminSelect>

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>{s.galleryTitle}</h2>
              <ProductGalleryEditor
                mode="full"
                items={gallery}
                onChange={setGallery}
                strings={galleryStr}
              />
            </div>

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>{s.delivery}</h2>
              <AdminTextArea
                className={pn.wideTextarea}
                value={deliveryText}
                onChange={(e) => setDeliveryText(e.target.value)}
                rows={6}
                placeholder={s.deliveryPh}
              />
            </div>

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>{s.techTitle}</h2>
              <AdminTextArea
                className={pn.wideTextarea}
                value={technicalSpecs}
                onChange={(e) => setTechnicalSpecs(e.target.value)}
                rows={6}
                placeholder={s.techPh}
              />
            </div>

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>{s.extraTitle}</h2>
              <RichBlock
                value={additionalInfoHtml}
                onChange={setAdditionalInfoHtml}
                placeholder={s.extraPh}
                uploadMedia={(file, type) => adminUploadRichMedia(file, type)}
                pickMediaFromLibrary={pickMediaFromLibrary}
                onUploadError={(msg) => setSaveError(msg)}
              />
            </div>

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>SEO</h2>
              <div className={pn.sectionStack}>
                <AdminTextField
                  label="Meta title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
                <AdminTextArea
                  label="Meta description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <aside className={pn.productFormPlacement} aria-label={s.placementAria}>
            <p className={pn.placementHeading}>{s.placementHeading}</p>

            <div className={pn.placementBlock}>
              <AdminSelect
                label={s.mainCategory}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">{s.choosePlaceholder}</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={`${catalogStyles.groupHeading} ${pn.placementGroupHeading}`}>
                {s.contextTagsTitle}
              </h3>
              <div className={pn.additionalCatsWrap}>
                <AdminSelect
                  label={s.addContextTag}
                  aria-label={s.addContextTagAria}
                  value={catalogTagPick}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addCatalogTagFromDropdown(v);
                    else setCatalogTagPick('');
                  }}
                  disabled={catalogTags.length === 0}
                >
                  <option value="">{s.chooseContextTag}</option>
                  {catalogTagsAvailableForPick.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </AdminSelect>
                {catalogTags.length === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.loadingProduct}
                  </p>
                ) : null}
                {catalogTagIds.size > 0 ? (
                  <AdminPillChipList aria-label={s.selectedContextTagsAria}>
                    {catalogTags
                      .filter((t) => catalogTagIds.has(t.id))
                      .map((t) => (
                        <AdminPillChip
                          key={t.id}
                          onRemove={() => removeCatalogTag(t.id)}
                          removeAriaLabel={s.removeContextTagAria(t.name)}
                        >
                          {t.name}
                        </AdminPillChip>
                      ))}
                  </AdminPillChipList>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noContextTagsSelected}
                  </p>
                )}
              </div>
            </div>

            <div className={pn.placementBlock}>
              <div className={catalogStyles.label}>
                <div className={catalogStyles.labelCheckboxRow}>
                  <AccountCheckbox
                    id="product-new-active"
                    className={catalogStyles.adminCheckboxForm}
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    aria-label={s.publishedAria}
                  />
                  <label htmlFor="product-new-active">{s.publishedLabel}</label>
                </div>
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={`${catalogStyles.groupHeading} ${pn.placementGroupHeading}`}>
                {s.extraCatsTitle}
              </h3>
              {!categoryId ? (
                <p className={catalogStyles.muted}>{s.selectMainFirst}</p>
              ) : (
                <div className={pn.additionalCatsWrap}>
                  <AdminSelect
                    label={s.addCategory}
                    aria-label={s.addCategoryAria}
                    value={additionalCatPick}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addAdditionalCategoryFromDropdown(v);
                      else setAdditionalCatPick('');
                    }}
                  >
                    <option value="">{s.chooseCategory}</option>
                    {categoriesAvailableForAdditional.map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryLabel(c)}
                      </option>
                    ))}
                  </AdminSelect>
                  {categoriesAvailableForAdditional.length === 0 &&
                  additionalCategoryIds.size === 0 ? (
                    <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                      {s.noOtherCats}
                    </p>
                  ) : null}
                  {additionalCategoryIds.size > 0 ? (
                    <AdminPillChipList aria-label={s.selectedCatsAria}>
                      {Array.from(additionalCategoryIds).map((id) => {
                        const c = categories.find((x) => x.id === id);
                        if (!c) return null;
                        const label = categoryLabel(c);
                        return (
                          <AdminPillChip
                            key={id}
                            onRemove={() => removeAdditionalCategory(id)}
                            removeAriaLabel={s.removeCatAria(label)}
                          >
                            {label}
                          </AdminPillChip>
                        );
                      })}
                    </AdminPillChipList>
                  ) : null}
                </div>
              )}
            </div>

            <div className={pn.placementBlock}>
              <h3 className={`${catalogStyles.groupHeading} ${pn.placementGroupHeading}`}>
                {s.collectionsTitle}
              </h3>
              <div className={pn.additionalCatsWrap}>
                <AdminSelect
                  label={s.addCollection}
                  aria-label={s.addCollectionAria}
                  value={collectionPick}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addCuratedCollectionFromDropdown(v);
                    else setCollectionPick('');
                  }}
                >
                  <option value="">{s.chooseCollection}</option>
                  {collectionsAvailableForPick.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AdminSelect>
                {collectionsAvailableForPick.length === 0 && curatedCollectionIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noCollectionsLeft}
                  </p>
                ) : null}
                {curatedCollectionIds.size > 0 ? (
                  <AdminPillChipList aria-label={s.selectedCollectionsAria}>
                    {Array.from(curatedCollectionIds).map((id) => {
                      const c = productCollections.find((x) => x.id === id);
                      if (!c) return null;
                      return (
                        <AdminPillChip
                          key={id}
                          onRemove={() => removeCuratedCollection(id)}
                          removeAriaLabel={s.removeColAria(c.name)}
                        >
                          {c.name}
                        </AdminPillChip>
                      );
                    })}
                  </AdminPillChipList>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noCollectionsSelected}
                  </p>
                )}
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={`${catalogStyles.groupHeading} ${pn.placementGroupHeading}`}>
                {s.setsTitle}
              </h3>
              <p className={pn.placementHint}>{s.setsHint}</p>
              <div className={pn.additionalCatsWrap}>
                <AdminSelect
                  label={s.addSet}
                  aria-label={s.addSetAria}
                  value={productSetPick}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addProductSetFromDropdown(v);
                    else setProductSetPick('');
                  }}
                >
                  <option value="">{s.chooseSet}</option>
                  {setsAvailableForPick.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name}
                    </option>
                  ))}
                </AdminSelect>
                {setsAvailableForPick.length === 0 && curatedProductSetIds.size === 0 ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noSetsLeft}
                  </p>
                ) : null}
                {curatedProductSetIds.size > 0 ? (
                  <AdminPillChipList aria-label={s.selectedSetsAria}>
                    {Array.from(curatedProductSetIds).map((id) => {
                      const setRow = productSets.find((x) => x.id === id);
                      if (!setRow) return null;
                      return (
                        <AdminPillChip
                          key={id}
                          onRemove={() => removeProductSet(id)}
                          removeAriaLabel={s.removeSetAria(setRow.name)}
                        >
                          {setRow.name}
                        </AdminPillChip>
                      );
                    })}
                  </AdminPillChipList>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}

        <div className={`${catalogStyles.formActions} ${pn.actionsBar}`}>
          <AdminCompactBtn
            type="submit"
            variant="accent"
            disabled={saving || !!loadError || (!!productId && !productLoaded)}
          >
            {saving
              ? isEdit
                ? s.saveBusyEdit
                : s.saveBusyCreate
              : isEdit
                ? s.save
                : s.createProduct}
          </AdminCompactBtn>
          <AdminCompactBtnLink href="/admin/catalog/products" variant="outline">
            {s.cancel}
          </AdminCompactBtnLink>
        </div>
      </form>

      {isEdit && productId && product ? (
        <>
          <ProductModificationsSection
            productId={productId}
            initialModifications={product.modifications}
            onProductMutated={applyProduct}
          />

          <ProductElementsSection
            productId={productId}
            brandId={normalizedBrandId}
            initialElements={product.elements}
            onProductMutated={applyProduct}
          />

          <div className={pn.section}>
            <div className={catalogStyles.sectionHead}>
              <h2 className={catalogStyles.groupHeading}>{s.variantsTitle}</h2>
              <AdminCompactBtn
                type="button"
                onClick={openVariantCreateModal}
                disabled={!canCreateVariant}
                title={canCreateVariant ? undefined : s.addVariantDisabled}
              >
                {s.addVariant}
              </AdminCompactBtn>
            </div>
            {variants.length === 0 ? (
              <p className={catalogStyles.muted}>{s.noVariants}</p>
            ) : (
              <div className={catalogStyles.tableWrap}>
                <table className={catalogStyles.table}>
                  <thead>
                    <tr>
                      <th>{s.thVarName}</th>
                      <th>{s.thMod}</th>
                      <th>{s.thElements}</th>
                      <th>{s.thPrice}</th>
                      <th>{s.thVis}</th>
                      <th className={catalogStyles.tableCellActions} />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id}>
                        <td>
                          {v.displayName}
                          {v.isDefault ? (
                            <AdminPillBadge aria-label={s.defaultAria}>{s.defaultBadge}</AdminPillBadge>
                          ) : null}
                        </td>
                        <td>{v.modificationLabel || '—'}</td>
                        <td>{v.selectionsLabel ?? '—'}</td>
                        <td>
                          {Number(v.price).toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          {v.currency}
                        </td>
                        <td>{v.isActive ? c.yes : c.no}</td>
                        <td className={catalogStyles.tableCellActions}>
                          <Link
                            href={`/admin/catalog/products/${productId}/variants/${v.id}`}
                            className={catalogStyles.tableIconLink}
                            aria-label={s.editVariantAria}
                          >
                            <img src="/icons/edit.svg" alt="" width={20} height={20} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={pn.section}>
            <AdminTextField
              label="Доп. лайки (витрина, не строки в БД)"
              type="number"
              min={0}
              max={10_000_000}
              inputMode="numeric"
              value={String(likesAdminBoost)}
              onChange={(e) =>
                setLikesAdminBoost(Math.max(0, Math.floor(Number(e.target.value) || 0)))
              }
            />
            <p className={catalogStyles.muted} style={{ marginTop: 6 }}>
              Реальные лайки: {product?.likesUserCount ?? 0}. Публично:{' '}
              {(product?.likesUserCount ?? 0) + likesAdminBoost}
            </p>
          </div>
        </>
      ) : null}

      {variantCreateOpen ? (
        <div
          className={objStyles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVariantCreateOpen(false);
          }}
        >
          <div
            className={objStyles.modal}
            style={{ maxWidth: 480, width: '100%' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 className={`${catalogStyles.groupHeading} ${pn.modalHeading}`}>{s.modalNewVariant}</h2>
            <p className={catalogStyles.muted} style={{ margin: 0 }}>
              {s.modalNewVariantLead}
            </p>
            <AdminSelect
              label={s.modification}
              value={variantCreateModificationId}
              onChange={(e) => setVariantCreateModificationId(e.target.value)}
            >
              {product?.modifications.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </AdminSelect>
            {variantCreateError ? (
              <p className={catalogStyles.error} style={{ margin: 0 }}>
                {variantCreateError}
              </p>
            ) : null}
            <div className={catalogStyles.formActions}>
              <AdminCompactBtn
                type="button"
                variant="accent"
                onClick={() => {
                  void createVariant();
                }}
                disabled={variantCreateBusy || !variantCreateModificationId}
              >
                {variantCreateBusy ? s.modalCreateBusy : s.modalCreate}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                variant="outline"
                onClick={() => setVariantCreateOpen(false)}
                disabled={variantCreateBusy}
              >
                {s.modalCancel}
              </AdminCompactBtn>
            </div>
          </div>
        </div>
      ) : null}

      {picker ? (
        <MediaLibraryPickerModal
          open
          title={picker.title}
          mediaFilter={picker.filter}
          onClose={() => {
            const r = richPickResolver.current;
            if (r) {
              richPickResolver.current = null;
              r(null);
            }
            setPicker(null);
          }}
          onPick={handlePickerPick}
        />
      ) : null}
    </>
  );
}

export function ProductNewClient() {
  return <ProductFormClient />;
}
