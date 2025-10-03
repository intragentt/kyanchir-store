// Местоположение: src/components/admin/index.ts

// Admin Components - универсальный подход
import ProductTable from './ProductTable';
import DashboardControls from './DashboardControls';
import EditProductForm from './EditProductForm';
import AddVariantForm from './AddVariantForm';
import AddSizeForm from './AddSizeForm';
import AdminHeader from './AdminHeader';
import CreateProductForm from './CreateProductForm';
import ApiKeyModal from './ApiKeyModal';
import ConflictResolutionModal from './ConflictResolutionModal';
import DryRunModal from './DryRunModal';
import MappingsTable from './MappingsTable';

// Re-export
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

// Named exports из подпапок (они уже используют named exports)
export { VariantManager } from './edit-product-form/VariantManager';
export { ProductBasicDetailsForm } from './edit-product-form/ProductBasicDetailsForm';
export { ProductVariantsManager } from './edit-product-form/ProductVariantsManager';
export { VariantCard } from './edit-product-form/VariantCard';
export { ProductTableRow } from './product-table/ProductTableRow';
export { ProductDetailsPanel } from './product-table/ProductDetailsPanel';
export { EditableCountdownTimer } from './product-table/EditableCountdownTimer';
