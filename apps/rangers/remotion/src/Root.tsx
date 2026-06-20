import { Composition, registerRoot } from "remotion";
import { HeroBg } from "./HeroBg";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HeroBg"
      component={HeroBg}
      durationInFrames={300}   // 10秒 @ 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(RemotionRoot);
