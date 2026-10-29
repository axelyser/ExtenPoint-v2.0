export function parseCapacity(value=30){
  const capacity=Number(value);
  if(String(value).trim()===''||!Number.isInteger(capacity)||capacity<1||capacity>10000)throw Error('El cupo debe ser un número entero entre 1 y 10000.');
  return capacity;
}
export function capacityStatus(activity,counts={}){
  const total=parseCapacity(activity.cupoMaximo??30);
  const enrolled=Number(counts[activity.id]??0);
  return {total,enrolled,available:Math.max(0,total-enrolled),full:enrolled>=total};
}
