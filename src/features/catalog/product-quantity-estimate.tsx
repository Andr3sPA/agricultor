import {
  calculateUnitPriceTotal,
  formatAgriculturalValue,
} from "@/features/unit-converter/agricultural-units";

const quantityFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 });

export function ProductQuantityEstimate({
  quantity,
  unit,
  priceCOP,
}: {
  quantity: string;
  unit: string;
  priceCOP: number;
}) {
  const total = calculateUnitPriceTotal(quantity, String(priceCOP)).value;
  if (total === null) return null;

  return (
    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-950">
      <dt className="font-medium">
        Total estimado por {quantityFormatter.format(Number(quantity))} {unit}
      </dt>
      <dd className="mt-1 break-words text-base font-semibold">
        $ {formatAgriculturalValue(total)} COP
      </dd>
    </div>
  );
}
