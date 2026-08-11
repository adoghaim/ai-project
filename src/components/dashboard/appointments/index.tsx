import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { Pagination, Skeleton } from '@mui/material';
import dayjs from 'dayjs';
import React from 'react';
import { Card, Title } from '../../common/index.js';

const AppointmentsToday = React.memo(() => {
  const [appointments, setAppointments] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [limit, _] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          '/api/appointments' + '?offset=' + offset + '&limit=' + limit,
        );
        console.log('response', response);
        const data = await response.json();
        if (data?.items?.length) {
          setAppointments(data.items);
        }
        if (data?.total) {
          setTotal(data.total);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [offset, limit]);

  const handleSetPagination = React.useCallback(
    (_, value) => {
      setOffset((value - 1) * limit);
    },
    [offset, limit],
  );

  return (
    <Card>
      <Title>Today's Appointments</Title>
      <TableContainer component={Paper} style={{ maxHeight: 400, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Car Interested In</TableCell>
              <TableCell>Show/No Show</TableCell>
              <TableCell>Confirmed</TableCell>
              <TableCell>New/Used</TableCell>
              <TableCell>Sales Rep</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <React.Fragment>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
                <TableCell>
                  <Skeleton animation="wave" />
                </TableCell>
              </React.Fragment>
            )}
            {!loading &&
              appointments?.length > 0 &&
              appointments.map((appointment: any) => (
                <TableRow key={appointment.id}>
                  <TableCell scope="row">{dayjs(appointment.time).format('h:mm A')}</TableCell>
                  <TableCell>{appointment.name}</TableCell>
                  <TableCell>{appointment?.car?.model ?? ''}</TableCell>
                  <TableCell
                    style={{
                      color:
                        dayjs(appointment?.time).format('h:mm A') > dayjs().format('h:mm A')
                          ? 'green'
                          : 'red',
                    }}
                  >
                    {dayjs(appointment.time).format('h:mm A') > dayjs().format('h:mm A')
                      ? 'Show'
                      : 'No Show'}
                  </TableCell>
                  <TableCell>{appointment?.car?.status === 'Sold' ? 'Yes' : 'No '}</TableCell>
                  <TableCell>{appointment.isNew ? 'New' : 'Used'}</TableCell>
                  <TableCell>{appointment?.salesRep?.name ?? ''}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        style={{ margin: '0 auto', width: 'fit-content', marginTop: '0.5rem' }}
        count={Math.round(total / limit)}
        variant="outlined"
        shape="rounded"
        color="primary"
        onChange={handleSetPagination}
      />
    </Card>
  );
});

export default AppointmentsToday;
