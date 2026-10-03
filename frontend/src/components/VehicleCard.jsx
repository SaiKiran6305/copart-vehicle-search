import vehicleImages from "../data/vehicleImages.js";

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

export default function VehicleCard({ vehicle, isFavorite, onFavoriteToggle }) {
  const image = vehicleImages[vehicle.make] || vehicleImages.default;

  return (
    <article
      className="vehicle-card"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
    >
      <div className="vehicle-card__visual">
        <img
          className="vehicle-card__image"
          src={image}
          alt=""
          aria-hidden="true"
        />
        <span className="vehicle-card__visual-year">{vehicle.year}</span>
        <span className="vehicle-card__lot">{vehicle.lotNumber}</span>
        <button
          className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
          type="button"
          aria-label={isFavorite
            ? `Remove ${vehicle.year} ${vehicle.make} ${vehicle.model} from saved vehicles`
            : `Save ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          aria-pressed={isFavorite}
          onClick={() => onFavoriteToggle(vehicle.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
          </svg>
        </button>
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
