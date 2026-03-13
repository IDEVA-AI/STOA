import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, X, Check, Loader2, Package, DollarSign, Eye } from 'lucide-react';
import {
  Card, CardBody, Button, Badge, Input, Toggle, StatCard,
} from '../ui';
import { Heading, Label, Text } from '../ui/Typography';
import { listItem } from '@/src/lib/motion';
import * as api from '@/src/services/api';
import { useWorkspace } from '@/src/hooks/useWorkspace';
import type { Product } from '@/src/types';

type AdminCourse = api.AdminCourse;

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function AdminProducts() {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState<'course' | 'bundle'>('course');
  const [newCourseIds, setNewCourseIds] = useState<number[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editType, setEditType] = useState<'course' | 'bundle'>('course');
  const [editCourseIds, setEditCourseIds] = useState<number[]>([]);

  // Course linking expanded
  const [linkingProductId, setLinkingProductId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [prods, crs] = await Promise.all([
        api.getProducts(workspaceId),
        api.getAdminCourses(),
      ]);
      setProducts(prods);
      setCourses(crs);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) loadData();
  }, [workspaceId, loadData]);

  // CRUD
  const handleCreate = async () => {
    if (!newTitle.trim() || !workspaceId) return;
    try {
      await api.createProduct({
        workspace_id: workspaceId,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        price: parseFloat(newPrice) || 0,
        type: newType,
        courseIds: newCourseIds.length > 0 ? newCourseIds : undefined,
      });
      setShowNewProduct(false);
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
      setNewType('course');
      setNewCourseIds([]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.updateProduct(id, {
        title: editTitle,
        description: editDesc,
        price: parseFloat(editPrice) || 0,
        type: editType,
        courseIds: editCourseIds,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublished = async (product: Product) => {
    try {
      await api.updateProduct(product.id, {
        is_published: product.is_published ? 0 : 1,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditTitle(product.title);
    setEditDesc(product.description || '');
    setEditPrice(String(product.price));
    setEditType(product.type);
    setEditCourseIds(product.courses?.map((c) => c.id) || []);
  };

  const toggleCourseId = (ids: number[], id: number, setter: (v: number[]) => void) => {
    setter(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = products.filter((p) => p.is_published).length;
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text muted>Selecione um workspace</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Total de Produtos" value={String(products.length)} />
        <StatCard label="Publicados" value={String(publishedCount)} />
        <StatCard label="Receita Total" value={formatPrice(totalRevenue)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto" icon={<Plus size={16} />} onClick={() => setShowNewProduct(true)}>Novo Produto</Button>
      </div>

      {/* New Product Form */}
      <AnimatePresence>
        {showNewProduct && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card variant="elevated">
              <CardBody className="space-y-4">
                <Heading level={3}>Novo Produto</Heading>
                <Input
                  placeholder="Titulo do produto"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Descricao (opcional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Input
                    className="w-full sm:w-auto"
                    placeholder="Preco (ex: 97.00)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    type="number"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'course' | 'bundle')}
                    className="w-full sm:w-auto h-10 px-4 bg-surface border border-line text-sm focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="course">Curso</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>

                {/* Course checkboxes */}
                {courses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vincular cursos:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {courses.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-gold transition-colors">
                          <input
                            type="checkbox"
                            checked={newCourseIds.includes(c.id)}
                            onChange={() => toggleCourseId(newCourseIds, c.id, setNewCourseIds)}
                            className="accent-[var(--color-gold)]"
                          />
                          {c.title}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button onClick={handleCreate}>Criar Produto</Button>
                  <Button variant="secondary" onClick={() => { setShowNewProduct(false); setNewTitle(''); setNewDesc(''); setNewPrice(''); setNewCourseIds([]); }}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product List */}
      <div className="space-y-6">
        {filtered.map((product, i) => {
          const isEditing = editingId === product.id;
          const isLinking = linkingProductId === product.id;

          return (
            <motion.div key={product.id} {...listItem(i)}>
              <Card variant="elevated">
                <CardBody className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        placeholder="Titulo"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <Input
                        placeholder="Descricao"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <Input
                          className="w-full sm:w-auto"
                          placeholder="Preco"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          type="number"
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as 'course' | 'bundle')}
                          className="w-full sm:w-auto h-10 px-4 bg-surface border border-line text-sm focus:outline-none focus:border-gold transition-colors"
                        >
                          <option value="course">Curso</option>
                          <option value="bundle">Bundle</option>
                        </select>
                      </div>

                      {courses.length > 0 && (
                        <div className="space-y-2">
                          <Label>Vincular cursos:</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {courses.map((c) => (
                              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-gold transition-colors">
                                <input
                                  type="checkbox"
                                  checked={editCourseIds.includes(c.id)}
                                  onChange={() => toggleCourseId(editCourseIds, c.id, setEditCourseIds)}
                                  className="accent-[var(--color-gold)]"
                                />
                                {c.title}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={() => handleUpdate(product.id)}>Salvar</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <Heading level={3}>{product.title}</Heading>
                            <Badge variant={product.type === 'bundle' ? 'gold' : 'default'}>
                              {product.type === 'bundle' ? 'Bundle' : 'Curso'}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${product.is_published ? 'bg-emerald-400' : 'bg-warm-gray/30'}`} />
                              <Label>{product.is_published ? 'Publicado' : 'Rascunho'}</Label>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                            <Label variant="gold" className="text-lg font-bold">{formatPrice(product.price)}</Label>
                            <Label>{product.course_count ?? product.courses?.length ?? 0} cursos</Label>
                            <Label className="text-warm-gray/60">{formatDate(product.created_at)}</Label>
                          </div>
                          {product.description && (
                            <Text size="sm" muted>{product.description}</Text>
                          )}
                          {/* Linked courses badges */}
                          {product.courses && product.courses.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {product.courses.map((c) => (
                                <Badge key={c.id} variant="muted">{c.title}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Toggle
                            checked={!!product.is_published}
                            onChange={() => handleTogglePublished(product)}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEditing(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            icon={<Trash2 size={14} className="text-red-400" />}
                            onClick={() => handleDelete(product.id)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <Package size={32} className="mx-auto mb-4 text-warm-gray/30" />
            <Text muted>Nenhum produto encontrado</Text>
          </div>
        )}
      </div>
    </div>
  );
}
