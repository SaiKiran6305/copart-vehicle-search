const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value) {
  return value ? date.format(new Date(`${value}T00:00:00Z`)) : "—";
}

export default function VehicleCard({ vehicle }) {
  return (
    <article className="vehicle-card" aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
      <div className="vehicle-card__visual" aria-hidden="true">
        <span className="vehicle-card__visual-year">{vehicle.year}</span>
        <svg
          className="vehicle-card__icon"
          viewBox="0 0 160 80"
          role="presentation"
          focusable="false"
        >
          <path d="M24 48h9l9-21c2-5 6-8 12-8h48c5 0 9 2 12 7l13 22h8c5 0 9 4 9 9v9h-14a13 13 0 0 0-25 0H60a13 13 0 0 0-25 0H22v-9c0-5 1-9 2-9Zm25-20-8 19h76l-11-18c-1-2-3-3-6-3H54c-2 0-4 1-5 2ZM47 71a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm80 0a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
        </svg>
        <span className="vehicle-card__lot">{vehicle.lotNumber}</span>
      </div>

      <div className="vehicle-card__body">
        <div className="vehicle-card__heading">
          <div>
            <h3>{vehicle.make} {vehicle.model}</h3>
            <p>{vehicle.location}</p>
          </div>
          <span className="condition-pill">{vehicle.condition}</span>
        </div>

        <dl className="vehicle-card__details">
          <div>
            <dt>Sale date</dt>
            <dd>{formatDate(vehicle.saleDate)}</dd>
          </div>
          <div>
            <dt>Odometer</dt>
            <dd>{number.format(vehicle.odometer)} mi</dd>
          </div>
        </dl>

        <div className="vehicle-card__value">
          <span>Estimated value</span>
          <strong>{currency.format(vehicle.estimatedValue)}</strong>
        </div>
      </div>
    </article>
  );
}
