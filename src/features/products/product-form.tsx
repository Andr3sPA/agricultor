"use client";

import { useActionState } from "react";
import { createProduct, updateProduct, type ProductFormState } from "./product-actions";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "./product-validation";

export type ProductFormValues = {
  id?: string;
  name: string;
  category: string;
  availableQuantity: string;
  unit: string;
  priceCOP: string;
  municipality: string;
};

const initialState: ProductFormState = {};

type ProductFormProps = {
  product?: ProductFormValues;
};

export function ProductForm({ product }: ProductFormProps) {
  const [state, action, pending] = useActionState(
    product ? updateProduct : createProduct,
    initialState,
  );
  const editing = Boolean(product);

  return (
    <form action={action} className="mt-6 space-y-5">
      {product?.id && <input name="productId" type="hidden" value={product.id} />}
      <div>
        <label className="block text-sm font-medium" htmlFor="name">
          Nombre del producto
        </label>
        <input
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          defaultValue={product?.name ?? ""}
          id="name"
          maxLength={100}
          minLength={2}
          name="name"
          required
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-sm text-red-800" id="name-error">
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="category">
          Categoría
        </label>
        <select
          aria-describedby={state.fieldErrors?.category ? "category-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.category)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          defaultValue={product?.category ?? ""}
          id="category"
          name="category"
          required
        >
          <option value="">Elige una categoría</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category && (
          <p className="mt-1 text-sm text-red-800" id="category-error">
            {state.fieldErrors.category}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="availableQuantity">
          Cantidad disponible
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.availableQuantity ? "quantity-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.availableQuantity)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          defaultValue={product?.availableQuantity ?? ""}
          id="availableQuantity"
          inputMode="decimal"
          min="0"
          name="availableQuantity"
          required
          step="0.001"
          type="number"
        />
        {state.fieldErrors?.availableQuantity && (
          <p className="mt-1 text-sm text-red-800" id="quantity-error">
            {state.fieldErrors.availableQuantity}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="unit">
          Unidad de medida
        </label>
        <select
          aria-describedby={state.fieldErrors?.unit ? "unit-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.unit)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          defaultValue={product?.unit ?? ""}
          id="unit"
          name="unit"
          required
        >
          <option value="">Elige una unidad</option>
          {PRODUCT_UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.unit && (
          <p className="mt-1 text-sm text-red-800" id="unit-error">
            {state.fieldErrors.unit}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="priceCOP">
          Precio por unidad de medida (COP)
        </label>
        <input
          aria-describedby={state.fieldErrors?.priceCOP ? "price-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.priceCOP)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          defaultValue={product?.priceCOP ?? ""}
          id="priceCOP"
          inputMode="numeric"
          min="1"
          name="priceCOP"
          required
          step="1"
          type="number"
        />
        {state.fieldErrors?.priceCOP && (
          <p className="mt-1 text-sm text-red-800" id="price-error">
            {state.fieldErrors.priceCOP}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="municipality">
          Municipio o localidad
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.municipality ? "municipality-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.municipality)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          defaultValue={product?.municipality ?? ""}
          id="municipality"
          maxLength={100}
          minLength={2}
          name="municipality"
          required
        />
        {state.fieldErrors?.municipality && (
          <p className="mt-1 text-sm text-red-800" id="municipality-error">
            {state.fieldErrors.municipality}
          </p>
        )}
      </div>
      <p className="text-sm text-slate-600">
        El estado se calcula automáticamente: una cantidad mayor que cero aparece como
        disponible; cero aparece como agotado.
      </p>
      {state.message && (
        <p
          className={
            state.ok ? "text-sm text-emerald-900" : "text-sm text-red-800"
          }
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : editing ? "Guardar cambios" : "Agregar producto"}
      </button>
    </form>
  );
}
