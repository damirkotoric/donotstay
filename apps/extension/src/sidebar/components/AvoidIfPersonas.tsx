import { Badge } from "@donotstay/ui";

interface AvoidIfPersonasProps {
  personas: string[];
}

function AvoidIfPersonas({ personas }: AvoidIfPersonasProps) {
  return (
    <section className="">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1">
        <span className="text-lg">🙂‍↔️</span> Avoid if you're...
      </h3>
      <div className="flex flex-wrap gap-2">
        {personas.map((persona, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="px-3 py-1.5 text-[13px] font-normal"
          >
            {persona}
          </Badge>
        ))}
      </div>
    </section>
  );
}

export default AvoidIfPersonas;
