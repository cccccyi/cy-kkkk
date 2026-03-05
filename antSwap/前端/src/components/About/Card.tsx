import { Link } from 'react-router-dom'
import styled, { DefaultTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
export enum CardType {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

const CardImg = styled.div`
  height: 190px;
  width: 100%;
  background-size: cover;       /* 保持铺满 */
  background-position: center;  /* 居中 */
  background-repeat: no-repeat; /* 不重复 */
  border-radius: 8px 8px 0 0;
  transition: transform 0.4s ease-in-out; /* 平滑过渡 */
`
const StyledCard = styled.div<{ isDarkMode: boolean; backgroundImgSrc?: string; type: CardType }>`
  background: rgba(0, 0, 0, 0.3);
  height: 330px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, type }) => (type === CardType.Primary ? 'transparent' : theme.backgroundOutline)};
  overflow: hidden;
  position: relative;
  /* 图片放大效果 */
  &:hover ${CardImg} {
    transform: scale(1.08);
  }

  /* 底部流光横条 */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    width: 100%;
    /* 拉长光条渐变，使尾部不暗淡 */
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.2) 0%,
      ${({ theme }) => theme.accentAction} 60%, 
      ${({ theme }) => theme.accentAction} 80%, 
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    background-position: left;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s ease-in-out, background-position 0.5s ease-in-out;
  }

  &:hover::after {
    transform: scaleX(1);
    background-position: right;
  }
`

const TitleRow = styled.p`
 font-size:23px;
 width:90%;
 margin-left:5%;
 margin-top:18px;
`

const MsgRow = styled.p`
 font-size:15px;
 color:rgba(172, 172, 172, 1);
  width:90%;
 margin-left:5%;
 line-height:25px;
  position:relative;
  top:-10px;
`

const CardTitle = styled.div`
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    font-size: 28px;
    line-height: 36px;
  }
`

const getCardDescriptionColor = (type: CardType, theme: DefaultTheme) => {
  switch (type) {
    case CardType.Secondary:
      return theme.textSecondary
    default:
      return theme.textPrimary
  }
}

const CardDescription = styled.div<{ type: CardType }>`
  display: flex;
  flex-direction: column;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme, type }) => getCardDescriptionColor(type, theme)};
  padding: 0 40px 0 0;
  max-width: 480px;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    font-size: 20px;
    line-height: 28px;
    max-width: 480px;
  }
`

const CardCTA = styled(CardDescription)`
  color: ${({ theme }) => theme.accentAction};
  font-weight: 500;
  margin: 24px 0 0;
  cursor: pointer;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};

  &:hover {
    opacity: 0.6;
  }
`

const Card = ({
  type = CardType.Primary,
  title,
  description,
  backgroundImgSrc,
  icon,
    img, // ✅ 新增

}: {
  type?: CardType
  title: string
  description: string
  backgroundImgSrc?: string
  icon?: React.ReactNode
    img?: string // ✅ 类型声明

}) => {
  const isDarkMode = useIsDarkMode()
    const { i18n } = useLingui()

  return (
    <StyledCard type={type} isDarkMode={isDarkMode} backgroundImgSrc={backgroundImgSrc}>
      {img && <CardImg style={{ backgroundImage: `url(${img})` }} />}
      <TitleRow style={{fontFamily:'U1'}}>
         <Trans>
              {i18n._(title)}
         </Trans>
      </TitleRow >
      <MsgRow>
            {i18n._(description)}
      </MsgRow>
    </StyledCard>
  )
}

export default Card