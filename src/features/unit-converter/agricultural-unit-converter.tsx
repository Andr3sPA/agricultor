"use client";

import { useState, type FormEvent } from "react";
import {
  convertAgriculturalUnits,
  formatAgriculturalValue,
  getUnitLabel,
  UNIT_CATEGORIES,
  type UnitCategoryKey,
} from "@/features/unit-converter/agricultural-units";

export function AgriculturalUnitConverter() {
  const [category, setCategory] = useState<UnitCategoryKey>("mass");
  const [fromUnit, setFromUnit] = useState("g");
  const [toUnit, setToUnit] = useState("kg");
  const [amount, setAmount] = useState("");
  const [convertedValue, setConvertedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedCategory = UNIT_CATEGORIES.find(
    (item) => item.key === category,
  )!;

  function resetResult() {
    setConvertedValue(null);
    setError(null);
  }

  function handleCategoryChange(value: string) {
    const nextCategory = UNIT_CATEGORIES.find((item) => item.key === value);
    if (!nextCategory) {
      return;
    }

    setCategory(nextCategory.key);
    setFromUnit(nextCategory.units[0].key);
    setToUnit(nextCategory.units[1].key);
    resetResult();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const conversion = convertAgriculturalUnits(
      amount,
      category,
      fromUnit,
      toUnit,
    );
    setError(conversion.error);
    setConvertedValue(conversion.value);
  }

  const amountErrorId = "unit-converter-amount-error";

  return (
    <form className="mt-6 space-y-6" noValidate onSubmit={handleSubmit}>
      <div>
        <label
          className="block font-medium text-slate-900"
          htmlFor="unit-converter-category"
        >
          Tipo de medida
        </label>
        <select
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-800"
          id="unit-converter-category"
          onChange={(event) => handleCategoryChange(event.target.value)}
          value={category}
        >
          {UNIT_CATEGORIES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="block font-medium text-slate-900"
            htmlFor="unit-converter-amount"
          >
            Cantidad
          </label>
          <p className="mt-1 text-sm text-slate-600" id="unit-converter-hint">
            Se aceptan decimales con punto o coma. El cero es válido.
          </p>
          <input
            aria-describedby={`unit-converter-hint${error ? ` ${amountErrorId}` : ""}`}
            aria-invalid={Boolean(error)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-800"
            id="unit-converter-amount"
            inputMode="decimal"
            maxLength={60}
            onChange={(event) => {
              setAmount(event.target.value);
              resetResult();
            }}
            type="text"
            value={amount}
          />
          {error && (
            <p
              className="mt-1 text-sm font-medium text-rose-800"
              id={amountErrorId}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div>
          <label
            className="block font-medium text-slate-900"
            htmlFor="unit-converter-from"
          >
            Convertir desde
          </label>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-800"
            id="unit-converter-from"
            onChange={(event) => {
              setFromUnit(event.target.value);
              resetResult();
            }}
            value={fromUnit}
          >
            {selectedCategory.units.map((unit) => (
              <option key={unit.key} value={unit.key}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block font-medium text-slate-900"
            htmlFor="unit-converter-to"
          >
            Convertir a
          </label>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-800"
            id="unit-converter-to"
            onChange={(event) => {
              setToUnit(event.target.value);
              resetResult();
            }}
            value={toUnit}
          >
            {selectedCategory.units.map((unit) => (
              <option key={unit.key} value={unit.key}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="min-h-11 rounded-xl border border-emerald-800 px-4 font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-800"
        onClick={() => {
          setFromUnit(toUnit);
          setToUnit(fromUnit);
          resetResult();
        }}
        type="button"
      >
        Intercambiar unidades
      </button>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 sm:w-auto"
        type="submit"
      >
        Convertir unidades
      </button>

      {convertedValue !== null && (
        <section
          aria-live="polite"
          aria-labelledby="unit-converter-result-title"
          className="rounded-2xl bg-emerald-50 p-5"
        >
          <h2
            className="text-xl font-semibold text-emerald-950"
            id="unit-converter-result-title"
          >
            Resultado
          </h2>
          <p className="mt-3 break-words text-lg text-emerald-950">
            <strong>{formatAgriculturalValue(amount.trim().replace(",", "."))}</strong>{" "}
            {getUnitLabel(category, fromUnit)} ={" "}
            <strong>{formatAgriculturalValue(convertedValue)}</strong>{" "}
            {getUnitLabel(category, toUnit)}
          </p>
          <p className="mt-2 text-sm text-emerald-950">
            Conversión exacta; no se redondeó el resultado.
          </p>
        </section>
      )}
    </form>
  );
}
