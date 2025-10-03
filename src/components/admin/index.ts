// Местоположение: src/components/admin/index.ts

// Admin Components - исправленные пути после миграции
import ProductTable from './dashboard/ProductTable';
import DashboardControls from './dashboard/DashboardControls';
import EditProductForm from './EditProductForm';
import AddVariantForm from './AddVariantForm';
import AddSizeForm from './AddSizeForm';
import AdminHeader from './AdminHeader';
import CreateProductForm from './CreateProductForm';
import ApiKeyModal from './ApiKeyModal';
import ConflictResolutionModal from './ConflictResolutionModal';
import DryRunModal from './DryRunModal';
import MappingsTable from './MappingsTable';

export {
  ProductTable,
  DashboardControls,
  EditProductForm,
  AddVariantForm,
  AddSizeForm,
  AdminHeader,
  CreateProductForm,
  ApiKeyModal,
  ConflictResolutionModal,
  DryRunModal,
  MappingsTable,
};

// Компоненты из перемещенных подпапок
export { ProductTableRow } from './product-table/ProductTableRow';
export { ProductDetailsPanel } from './product-table/ProductDetailsPanel';
export { EditableCountdownTimer } from './product-table/EditableCountdownTimer';
export { ProductBasicDetailsForm } from './edit-product-form/ProductBasicDetailsForm';
export { ProductVariantsManager } from './edit-product-form/ProductVariantsManager';
export { VariantCard } from './edit-product-form/VariantCard';
