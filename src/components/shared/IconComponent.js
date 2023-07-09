import { Avatar } from "antd";
const IconComponent = (props) => {
  const imgUrl = props.imgUrl;
  return <Avatar size={props.size} src={imgUrl} icon={props.imgUrl} />;
};

export default IconComponent;
