import { InterfaceElementName } from '@uniswap/analytics-events'
import { DollarSign, Terminal } from 'react-feather'
import styled from 'styled-components/macro'
import { lightTheme } from 'theme/colors'

import darkArrowImgSrc from './images/aboutArrowDark.png'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import darkDollarImgSrc from './images/aboutDollarDark.png'
import darkTerminalImgSrc from './images/aboutTerminalDark.png'
import s1 from './images/1.png'
import s2 from './images/2.png'
import ban1 from 'assets/images/ban1.webp'
import ban2 from 'assets/images/ban2.webp'
import ban3 from 'assets/images/ban3.webp'
import ban4 from 'assets/images/ban4.webp'
import ban5 from 'assets/images/ban5.webp'
import ban6 from 'assets/images/ban6.webp'
export const MAIN_CARDS = [
  {
    to: '',
    title: '合规优先，合法可信',
    description: '平台运行在经审批的合规链之上，确保交易环境合法、稳健。',
    cta: '',
    darkBackgroundImgSrc: s2,
    lightBackgroundImgSrc: s2,
    elementName: 'ban1',
  },
  {
    to: '',
    title: '用户资产自主掌控',
    description: '所有交易通过智能合约执行，无需托管，用户始终拥有唯一资金控制权，保障资产安全与隐私。',
    cta: '',
    darkBackgroundImgSrc: s1,
    lightBackgroundImgSrc: s1,
    elementName: 'ban2',
  },
]

const StyledCardLogo = styled.img`
  min-width: 20px;
  min-height: 20px;
  max-height: 48px;
  max-width: 48px;
`
export const MORE_CARDS = [
  {
    to: '',
    external: true,
    title: 'Compliance. Security. Trust.',
    description: 'Antswap runs on a compliant chain, offering open, safe, and transparent trading.',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkDollarImgSrc} alt="Earn" />,
    cta: '',
    elementName: '',
    img: ban1,
  },
  {
    to: '',
    title: 'Trusted by Design',
    description: 'Built on compliance, Antswap creates a reliable space for users and institutions.',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: '',
    elementName: '',
    img: ban2,
  },
  {
    to: '',
    external: true,
    title: 'Your Assets, Your Control',
    description: 'Users fully own their assets, with smart contracts ensuring safety and privacy.',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: '',
    elementName: '',
    img: ban3,
  },
  {
    to: '',
    external: true,
    title: 'Secure & Transparent',
    description: 'On-chain records plus compliance audits make every trade verifiable and trusted.',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkDollarImgSrc} alt="Earn" />,
    cta: '',
    elementName: '',
    img: ban4,
  },
  {
    to: '',
    title: 'Built for Institutions',
    description: 'Antswap connects seamlessly with custodians, auditors, insurers, and financial partners.',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: '',
    elementName: '',
    img: ban5,
  },
  {
    to: '',
    external: true,
    title: 'Future-Proof Growth',
    description: 'Growing within a compliant framework, Antswap embraces global digital opportunities.',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: '',
    elementName: '',
    img: ban6,
  },
]
