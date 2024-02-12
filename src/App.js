import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { DataGrid, GridRowModes, GridActionsCellItem, GridRowEditStopReasons } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import objectHash from 'object-hash';
import * as yup from 'yup';

const validationSchema = yup.object({
  customerName: yup
    .string('Enter your name')
    .required('Name is required'),
  startDate: yup
    .date('Enter a valid date')
    .required('Start date is required'),
  endDate: yup
    .date('Enter a valid date')
    .required('End date is required')
    .min(yup.ref('startDate'), "End date can't be before start date")
});

function generateId(values) {
  return objectHash({ name: values.customerName.toLowerCase(), startDate: values.startDate.format('MM/DD/YYYY'), endDate: values.endDate.format('MM/DD/YYYY') });
}

function App() {
  const [bookings, setBookings] = useState([]);
  const [messageInfo, setMessageInfo] = useState({ open: false, message: '', severity: 'success' });
  const [rowModesModel, setRowModesModel] = useState({});

  const formik = useFormik({
    initialValues: { customerName: '', startDate: dayjs(), endDate: dayjs() },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      const incomingBookingId = generateId(values);

      if (bookings.some((row) => row.id === incomingBookingId)) {
        setMessageInfo({ open: true, message: 'A booking already exists!', severity: 'error' });
        return;
      }

      setBookings(prevState => [...prevState, { id: incomingBookingId, ...values }]);
      setMessageInfo({ open: true, message: 'Booking added!', severity: 'success' });
    },
  });

  const handleMessageClose = () => {
    setMessageInfo({ ...messageInfo, open: false });
  }

  const RenderDateCell = ({ row, type }) => {
    const isInEditMode = rowModesModel[row.id]?.mode === GridRowModes.Edit
    if (isInEditMode) {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            disablePast
            id={row.id}
            name={row.id}
            defaultValue={row[type]}
          />
        </LocalizationProvider>
      );
    }

    return dayjs(row[type]).format('MM/DD/YYYY');
  }

  return (
    <>
      <Snackbar
        autoHideDuration={1000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={messageInfo.open}
        onClose={handleMessageClose}
      >
        <Alert
          onClose={handleMessageClose}
          severity={messageInfo.severity}
          variant="filled"
        >
          {messageInfo.message}
        </Alert>
      </Snackbar>
      <form onSubmit={formik.handleSubmit}>
        <Grid container fluid paddingTop={2}>
          <Grid item xs={3}>
            <TextField
              id="customerName"
              name="customerName"
              label="Name"
              variant="outlined"
              value={formik.values.customerName}
              onChange={formik.handleChange}
              error={formik.touched.customerName && Boolean(formik.errors.customerName)}
              helperText={formik.touched.customerName && formik.errors.customerName}
            />
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid item xs={3}>
              <DatePicker
                disablePast
                id="startDate"
                name="startDate"
                label="Start date"
                value={formik.values.startDate}
                onChange={e => {
                  formik.setFieldValue("startDate", e)
                }}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    error: formik.touched.startDate && Boolean(formik.errors.startDate),
                    helperText: formik.touched.startDate && formik.errors.startDate,
                  },
                }}
              />
            </Grid>
            <Grid item xs={3}>
              <DatePicker
                disablePast
                id="endDate"
                name="endDate"
                label="End date"
                value={formik.values.endDate}
                onChange={e => {
                  formik.setFieldValue("endDate", e)
                }}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    error: formik.touched.endDate && Boolean(formik.errors.endDate),
                    helperText: formik.touched.endDate && formik.errors.endDate,
                  },
                }}
              />
            </Grid>
          </LocalizationProvider>
          <Button variant="contained" color="success" type="submit">
            Book
          </Button>
        </Grid>
      </form >
      <Box paddingTop={2}>
        {
          bookings.length > 0 ?
            <DataGrid
              rows={bookings}
              columns={[
                {
                  field: 'customerName',
                  headerName: 'Name',
                  editable: true,
                  flex: 1,
                  minWidth: 200,
                },
                {
                  field: 'startDate',
                  headerName: 'Start Date',
                  minWidth: 200,
                  renderCell: ({ row }) => <RenderDateCell row={row} type="startDate" />,
                },
                {
                  field: 'endDate',
                  headerName: 'End Date',
                  minWidth: 200,
                  renderCell: ({ row }) => <RenderDateCell row={row} type="endDate" />,
                },
                {
                  field: 'actions',
                  type: 'actions',
                  minWidth: 200,
                  headerName: 'Actions',
                  getActions: ({ id }) => {
                    const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                    if (isInEditMode) {
                      return [
                        <GridActionsCellItem
                          icon={<SaveIcon />}
                          label="Save"
                          sx={{
                            color: 'primary.main',
                          }}
                          onClick={() => {
                            setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
                          }}
                        />,
                        <GridActionsCellItem
                          icon={<CancelIcon />}
                          label="Cancel"
                          className="textPrimary"
                          onClick={() => {
                            setRowModesModel({
                              ...rowModesModel,
                              [id]: { mode: GridRowModes.View, ignoreModifications: true },
                            })
                          }}
                          color="inherit"
                        />,
                      ];
                    }

                    return [
                      <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => {
                          setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
                        }}
                        color="inherit"
                      />,
                      <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={() => { setBookings(prevState => prevState.filter((row) => row.id !== id)); }}
                        color="inherit"
                      />,
                    ];
                  },
                },
              ]}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={(newRowModesModel) => {
                setRowModesModel(newRowModesModel);
              }}
              onRowEditStop={(params, event) => {
                if (params.reason === GridRowEditStopReasons.rowFocusOut) {
                  event.defaultMuiPrevented = true;
                }
              }}
              processRowUpdate={(newRow) => {
                const updatedRow = { ...newRow, isNew: false };
                setBookings(prevState => prevState.map((row) => (row.id === newRow.id ? updatedRow : row)));
                return updatedRow;
              }}
            /> : <div>No bookings</div>
        }
      </Box>
    </>
  );
}

export default App;