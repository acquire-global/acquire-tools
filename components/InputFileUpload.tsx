import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const VisuallyHiddenInput = styled('input')({
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	position: 'absolute',
	bottom: 0,
	left: 0,
	whiteSpace: 'nowrap',
	width: 1,
})

export default function InputFileUpload({
	onChange,
	accept,
	multiple,
	label,
}: {
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
	accept?: string
	multiple?: boolean
	label?: string
}) {
	return (
		<Button
			component='label'
			variant='contained'
			startIcon={<CloudUploadIcon />}>
			{label ?? 'Upload file'}
			<VisuallyHiddenInput
				type='file'
				onChange={onChange}
				accept={accept}
				multiple={multiple}
			/>
		</Button>
	)
}
