import { Highlight } from 'react-instantsearch-hooks-web';

export const HitComponent = ({ hit, sendEvent }: any) => (
  <div className="hit">
    <div className="hit-picture">
      <img src={`${hit.image}`} alt={hit.name} width={100} height={100} />
    </div>
    <div className="hit-content">
      <div>
        <Highlight attribute="name" hit={hit} />

      </div>
      <div className="hit-type">
        <Highlight attribute="type" hit={hit} />
      </div>
      <div className="hit-description">
        <span> - ${hit.price}</span>
        <span> - {hit.rating} stars</span>
      </div>
      <p className='product-actions'>
        <button className="conversion-btn"
          onClick={() => {
            sendEvent('conversion', hit, 'Product Ordered');
          }}>Add to cart</button>
      </p>
    </div>
  </div>
);
