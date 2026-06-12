import { Button, Card, Flex, Heading, Separator, Table } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Routes } from 'routes';

interface SimulationSummary {
  id: number;
  created_at: string;
  description: string;
  num_bodies: number;
}

const SimulationList = () => {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/simulation')
      .then((response) => response.json())
      .then(setSimulations)
      .catch(console.error);
  }, []);

  return (
    <Flex direction="column" align="center" p="6" gap="4">
      <Flex justify="between" align="center" style={{ width: '100%', maxWidth: '700px' }}>
        <Heading as="h1" size="6">Simulations</Heading>
        <Link to={Routes.FORM}>
          <Button>New Simulation</Button>
        </Link>
      </Flex>
      <Separator size="4" />
      <Card style={{ width: '100%', maxWidth: '70%' }}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Bodies</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {simulations.map((sim) => (
              <Table.Row key={sim.id}>
                <Table.Cell>{sim.id}</Table.Cell>
                <Table.Cell>{sim.created_at}</Table.Cell>
                <Table.Cell width="40%">{sim.description}</Table.Cell>
                <Table.Cell>{sim.num_bodies}</Table.Cell>
                <Table.Cell>
                  <Flex gap="3">
                    <Button variant="classic" onClick={() => navigate(`/simulation/${sim.id}`)}>
                    View
                  </Button>
                  <Button variant="classic" color="bronze" onClick={() => navigate(`/simulation/${sim.id}/edit`)}>
                    Modify for new run
                  </Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
    </Flex>
  );
};

export default SimulationList;
