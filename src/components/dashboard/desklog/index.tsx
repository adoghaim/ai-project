import {
  Card,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { Pagination, Skeleton, TableSortLabel } from '@mui/material';
import React from 'react';
import TransactionModal from '../../../components/transaction-modal/index.js';
import { ESaleStatus } from '../../../models/desklog.model.js';
import { Title } from '../../common/index.js';
import { dateFormat } from '../../../libs/utils/index.js';
import styles from './styles.js';

type Order = 'asc' | 'desc';

const DeskLog = () => {
  const [openTransactionModal, setOpenTransactionModal] = React.useState(false);
  const [currentLog, setCurrentLog] = React.useState();
  const [deskLogData, setDeskLogData] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [timeInSortOrder, setSortedTimeIns] = React.useState('asc');
  const [timeOutSortOrder, setSortedTimeOuts] = React.useState('asc');
  const [offset, setOffset] = React.useState(0);
  const [limit] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const closeTransactionModal = React.useCallback(() => {
    setOpenTransactionModal(false);
  }, []);

  // Function to handle status change
  const handleStatusChange = (event, logId) => {
    // Implement your logic to update the sale status for the corresponding logId
    // For example, you can update the status in the deskLogData array
    console.log(`New status for logId ${logId}:`, event.target.value);
  };

  const handleRowClick = (log) => {
    setOpenTransactionModal(true);
    setCurrentLog(log);
    // dispatch(modalReducerJs.setTransactionId('id'));
    // dispatch(modalReducerJs.openModal()); // set modal state to true to open the modal
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          '/api/desklogs' + '?offset=' + offset + '&limit=' + limit,
          // 'http://localhost:3434/api/desklogs' + '?offset=' + offset + '&limit=' + limit,
        );
        const data = await response.json();
        console.log('data', data);
        if (data?.items?.length) {
          setDeskLogData(data.items);
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

  const sortTimeInTable = (property: string) => (event: React.MouseEvent<unknown>) => {
    sortDeskLogs(timeInSortOrder === 'asc' ? 1 : -1, 'timeIn');
    setSortedTimeIns(timeInSortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortTimeOutTable = (property: string) => (event: React.MouseEvent<unknown>) => {
    sortDeskLogs(timeOutSortOrder === 'asc' ? 1 : -1, 'timeOut');
    setSortedTimeOuts(timeOutSortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortDeskLogs = (sortOrder: number, sortProp: string) => {
    deskLogData.sort((a, b) => {
      return sortOrder * a[sortProp].localeCompare(b[sortProp]);
    });
    setDeskLogData(deskLogData);
  };

  return (
    <React.Fragment>
      <TransactionModal
        open={openTransactionModal}
        onClose={closeTransactionModal}
        opportunity={currentLog}
      />
      <Card>
        <Title style={styles.DeskLogTitle}>Desk Log</Title>
        <TableContainer component={Paper} style={{ maxHeight: 600, overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Name</TableCell>
                <TableCell>Vehicle Interested</TableCell>
                <TableCell>Sale Status</TableCell>
                <TableCell>Trade-In</TableCell>
                <TableCell>Financing</TableCell>
                <TableCell>
                  Time In
                  <TableSortLabel
                    active={true}
                    direction={timeInSortOrder as Order}
                    onClick={sortTimeInTable('asc')}
                  ></TableSortLabel>
                </TableCell>
                <TableCell>
                  Time Out
                  <TableSortLabel
                    active={true}
                    direction={timeOutSortOrder as Order}
                    onClick={sortTimeOutTable('asc')}
                  ></TableSortLabel>
                </TableCell>
                <TableCell>Referral Source</TableCell>
                <TableCell>Sales Rep</TableCell>
                <TableCell>Phone Numbers</TableCell>
                <TableCell>Comments</TableCell>
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
                deskLogData.map((log) => (
                  <TableRow
                    key={log.id}
                    className={`saleStatus-${log.saleStatus.replace(/\s+/g, '-')}`}
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell>{log?.customer?.name ?? ''}</TableCell>
                    <TableCell>{log?.vehicle?.model}</TableCell>
                    <TableCell>
                      {/* Dropdown to change sale status */}
                      <Select
                        value={log.saleStatus}
                        onChange={(e) => handleStatusChange(e, log.id)}
                      >
                        <MenuItem value={ESaleStatus.InProgress}>In Progress</MenuItem>
                        <MenuItem value={ESaleStatus.Completed}>Completed</MenuItem>
                        <MenuItem value={ESaleStatus.Lost}>Lost</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>{log?.tradeIn ?? ''}</TableCell>
                    <TableCell>{log?.financing ?? ''}</TableCell>
                    <TableCell>{log?.timeIn ? dateFormat(log?.timeIn, true) : ''}</TableCell>
                    <TableCell>{log?.timeOut ? dateFormat(log?.timeOut, true) : ''}</TableCell>
                    <TableCell>{log?.referralSource ?? ''}</TableCell>
                    <TableCell>{log?.salesRep?.name ?? ''}</TableCell>
                    <TableCell>
                      {/* Display phone numbers */}
                      <div>Home: {log?.phoneNumberHome ?? ''}</div>
                      <div>Cell: {log?.phoneNumberCell ?? ''}</div>
                      <div>Work: {log?.phoneNumberWork ?? ''}</div>
                    </TableCell>
                    <TableCell>{log?.comments ?? ''}</TableCell>
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
    </React.Fragment>
  );
};

export default DeskLog;
