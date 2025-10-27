import { ChangeEvent, forwardRef, Ref, useImperativeHandle, useState } from 'react';
import styled from '@emotion/styled';
import { Box, Tooltip, Typography } from '@mui/material';
import noop from 'lodash-es/noop';
import { v1 as uuid } from 'uuid';

import B3Spin from '@/components/spin/B3Spin';
import { useB3Lang } from '@/lib/lang';
import { uploadB2BFile } from '@/shared/service/b2b';
import { snackbar } from '@/utils';

import { FILE_UPLOAD_ACCEPT_TYPE } from '../../../constants';

const FileListItem = styled(Box)((props: CustomFieldItems) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '393px',
  height: '45px',
  borderRadius: '100px',
  padding: '0 20px',
  backgroundColor: props.hasdelete === 'true' ? '#BAD6F2' : '#EFEFEF',
  marginBottom: '12px',
  '& .fileList-name-area': {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    columnGap: '12px',
    minWidth: 0,
  },
  '& .fileList-name': {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    flexGrow: 1,
    flexBasis: '100px',
    color: '#000000',
    fontSize: '16px',
    lineHeight: '24px',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
  },
  '& .fileList-clip-icon': {
    flexShrink: 0,
  },
}));

const FileUserTitle = styled(Typography)({
  fontFamily: 'Lato, sans-serif',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#7B7B7B',
  marginTop: '14px',
  textAlign: 'left',
});

const ClipIcon = () => (
  <Box
    component="svg"
    width={24}
    height={21}
    viewBox="0 0 26 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="fileList-clip-icon"
  >
    <path
      d="M13.0592 1.23666L2.81801 11.4779C0.393996 13.9019 0.393996 17.832 2.81801 20.256C5.24201 22.68 9.17213 22.68 11.5961 20.256L23.788 8.0641C25.404 6.44812 25.404 3.82804 23.788 2.212C22.172 0.596002 19.552 0.596002 17.9359 2.212L5.74409 14.4039C4.93607 15.2119 4.93607 16.5219 5.74409 17.3299C6.55205 18.1379 7.86209 18.1379 8.67011 17.3299L18.9113 7.08876"
      stroke="#231F20"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

const RemoveAttachmentIcon = () => (
  <Box
    component="svg"
    width={24}
    height={24}
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 7.05299L18.1327 19.2882C18.0579 20.3428 17.187 21.1599 16.1378 21.1599H7.86224C6.81296 21.1599 5.94208 20.3428 5.86732 19.2882L5 7.05299M10 11.0835V17.1293M14 11.0835V17.1293M15 7.05299V4.03009C15 3.47359 14.5523 3.02246 14 3.02246H10C9.44772 3.02246 9 3.47359 9 4.03009V7.05299M4 7.05299H20"
      stroke="#0A0A0A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

const AddAttachmentIcon = () => (
  <Box
    component="svg"
    width={24}
    height={21}
    viewBox="0 0 26 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.0592 1.23666L2.81801 11.4779C0.393996 13.9019 0.393996 17.832 2.81801 20.256C5.24201 22.68 9.17213 22.68 11.5961 20.256L23.788 8.0641C25.404 6.44812 25.404 3.82804 23.788 2.212C22.172 0.596002 19.552 0.596002 17.9359 2.212L5.74409 14.4039C4.93607 15.2119 4.93607 16.5219 5.74409 17.3299C6.55205 18.1379 7.86209 18.1379 8.67011 17.3299L18.9113 7.08876"
      stroke="#0067A0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Box>
);

const HelpIcon = () => (
  <Box
    component="svg"
    width={20}
    height={20}
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18 10.0767C18 14.5287 14.4183 18.1378 10 18.1378C5.58172 18.1378 2 14.5287 2 10.0767C2 5.62469 5.58172 2.01562 10 2.01562C14.4183 2.01562 18 5.62469 18 10.0767ZM10 7.05379C9.63113 7.05379 9.3076 7.25453 9.13318 7.55834C8.85664 8.04005 8.24491 8.20466 7.76685 7.926C7.28879 7.64735 7.12543 7.03095 7.40197 6.54924C7.91918 5.64833 8.88833 5.03852 10 5.03852C11.6569 5.03852 13 6.39192 13 8.06142C13 9.37761 12.1652 10.4973 11 10.9123V11.0843C11 11.6408 10.5523 12.092 10 12.092C9.44773 12.092 9.00001 11.6408 9.00001 11.0843V10.0767C9.00001 9.52019 9.44773 9.06906 10 9.06906C10.5523 9.06906 11 8.61792 11 8.06142C11 7.50492 10.5523 7.05379 10 7.05379ZM10 15.1149C10.5523 15.1149 11 14.6637 11 14.1072C11 13.5507 10.5523 13.0996 10 13.0996C9.44772 13.0996 9 13.5507 9 14.1072C9 14.6637 9.44772 15.1149 10 15.1149Z"
      fill="#0067A0"
    />
  </Box>
);

export interface FileObjects {
  id?: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  title?: string;
  hasDelete?: boolean;
  isCustomer?: boolean;
}

interface FileUploadProps {
  title?: string;
  tips?: string;
  maxFileSize?: number;
  fileNumber?: number;
  acceptedFiles?: string[];
  onchange?: (file: FileObjects) => void;
  fileList: FileObjects[];
  allowUpload?: boolean;
  onDelete?: (id: string) => void;
  limitUploadFn?: () => boolean;
  isEndLoadding?: boolean;
  requestType?: string;
}

function FileUpload(props: FileUploadProps, ref: Ref<unknown>) {
  const b3Lang = useB3Lang();
  const {
    title = b3Lang('global.fileUpload.addAttachment'),
    tips = b3Lang('global.fileUpload.maxFileSizeMessage'),
    maxFileSize = 2097152, // 2MB
    fileNumber = 3,
    limitUploadFn,
    acceptedFiles = FILE_UPLOAD_ACCEPT_TYPE,
    onchange = noop,
    fileList = [],
    allowUpload = true,
    onDelete = noop,
    isEndLoadding = false,
    requestType = 'quoteAttachedFile',
  } = props;

  const [loading, setLoading] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    setUploadLoadding: (flag: boolean) => setLoading(flag),
  }));

  const getMaxFileSizeLabel = (maxSize: number) => {
    if (maxSize / 1048576 > 1) {
      return `${(maxSize / 1048576).toFixed(1)}MB`;
    }
    if (maxSize / 1024 > 1) {
      return `${(maxSize / 1024).toFixed(1)}KB`;
    }
    return `${maxSize}B`;
  };

  const getRejectMessage = (rejectedFile: File, acceptedFiles: string[], maxFileSize: number) => {
    const { size, type } = rejectedFile;

    let isAcceptFileType = false;
    acceptedFiles.forEach((acceptedFileType: string) => {
      isAcceptFileType = new RegExp(acceptedFileType).test(type) || isAcceptFileType;
    });

    let message = '';
    if (!isAcceptFileType) {
      message = b3Lang('global.fileUpload.fileTypeNotSupported');
    }

    if (size > maxFileSize) {
      message = b3Lang('global.fileUpload.fileSizeExceedsLimit', {
        maxFileSize: getMaxFileSizeLabel(maxFileSize),
      });
    }

    if (message) {
      snackbar.error(message);
    }

    return message;
  };

  const uploadFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (limitUploadFn && limitUploadFn()) {
      return;
    }

    if (!limitUploadFn && fileList.length >= fileNumber) {
      snackbar.error(b3Lang('global.fileUpload.maxFileNumber', { fileNumber }));
      return;
    }

    const rejectionMessage = getRejectMessage(file, acceptedFiles, maxFileSize);
    if (rejectionMessage) {
      return;
    }

    try {
      setLoading(true);
      const {
        code,
        data: fileInfo,
        message,
      } = await uploadB2BFile({
        file,
        type: requestType,
      });
      if (code === 200) {
        onchange({
          ...fileInfo,
          id: uuid(),
        });
      } else {
        snackbar.error(message);
      }
    } finally {
      if (!isEndLoadding) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    const file = files && files.length > 0 ? files[0] : null;
    await uploadFile(file);
    event.target.value = '';
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const downloadFile = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const acceptAttribute = acceptedFiles.join(',');

  return (
    <B3Spin isSpinning={loading}>
      <Box
        sx={{
          padding: '12px 0 0',
          width: '100%',
        }}
      >
        <Box>
          {fileList.map((file, index) => (
            <Box key={file.id || index}>
              <FileListItem hasdelete={String(!!file?.hasDelete)}>
                <Box className="fileList-name-area">
                  <ClipIcon />
                  <Typography
                    className="fileList-name"
                    onClick={() => {
                      downloadFile(file.fileUrl);
                    }}
                  >
                    {file.fileName}
                  </Typography>
                </Box>
                {file.hasDelete && (
                  <Box
                    sx={{
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      handleDelete(file?.id || '');
                    }}
                  >
                    <RemoveAttachmentIcon />
                  </Box>
                )}
              </FileListItem>
              <FileUserTitle>{file.title || ''}</FileUserTitle>
            </Box>
          ))}
        </Box>
        {allowUpload && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              flexWrap: 'wrap',
              rowGap: '16px',
            }}
          >
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                columnGap: '12px',
                cursor: 'pointer',
              }}
            >
              <AddAttachmentIcon />
              <Typography
                sx={{
                  fontFamily: 'Lato, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#0067A0',
                }}
              >
                {title}
              </Typography>
              <Box
                component="input"
                type="file"
                accept={acceptAttribute}
                onChange={handleInputChange}
                sx={{ display: 'none' }}
              />
            </Box>

            <Tooltip title={tips} placement="top" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HelpIcon />
              </Box>
            </Tooltip>
          </Box>
        )}
      </Box>
    </B3Spin>
  );
}

export default forwardRef(FileUpload);
