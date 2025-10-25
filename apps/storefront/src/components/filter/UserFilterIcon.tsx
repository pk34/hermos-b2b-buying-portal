import { SvgIcon, type SvgIconProps } from '@mui/material';

function UserFilterIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.59998 3.60039C3.59998 2.93765 4.13723 2.40039 4.79998 2.40039H19.2C19.8627 2.40039 20.4 2.93765 20.4 3.60039V7.20039C20.4 7.51865 20.2735 7.82388 20.0485 8.04892L14.4 13.6974V18.0004C14.4 18.3187 14.2735 18.6239 14.0485 18.8489L11.6485 21.2489C11.3053 21.5921 10.7892 21.6948 10.3408 21.509C9.89235 21.3233 9.59998 20.8857 9.59998 20.4004V13.6974L3.95145 8.04892C3.7264 7.82388 3.59998 7.51865 3.59998 7.20039V3.60039Z"
        fill="#0067A0"
      />
    </SvgIcon>
  );
}

export default UserFilterIcon;
