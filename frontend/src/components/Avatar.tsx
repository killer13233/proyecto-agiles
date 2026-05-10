type Props = {
  nombre: string;
};

const Avatar: React.FC<Props> = ({ nombre }) => {
  const iniciales = nombre
    ? nombre
        .split(" ")
        .map((p) => p[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  return <div className="avatar">{iniciales}</div>;
};

export default Avatar;