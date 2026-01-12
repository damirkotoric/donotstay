import React from 'react';

interface AvoidIfPersonasProps {
  personas: string[];
}

function AvoidIfPersonas({ personas }: AvoidIfPersonasProps) {
  return (
    <section className="avoid-if">
      <h3>Avoid if you are...</h3>
      <div className="persona-list">
        {personas.map((persona, index) => (
          <span key={index} className="persona-tag">
            {persona}
          </span>
        ))}
      </div>
    </section>
  );
}

export default AvoidIfPersonas;
