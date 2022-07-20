import * as Yup from 'yup';
const dateValidationSchema = Yup.lazy(value => {
  if (value !== null) {
    return Yup.date().typeError('Invalid date');
  } else {
    return Yup.mixed().notRequired();
  }
});

const departmentSchema = Yup.lazy(value => {
  const departments = [
    'FD - Health Dept',
    'TF - Health Dept',
    'TF - Commercial Dept',
    'FD - Commercial Dept',
    'FD - Personal Dept',
    'FD - Tax Dept',
    'FD - Life Dept',
  ];
  return Yup.string().test(
    'is-valid-department',
    'department invalid',
    function(value) {
      return departments.some(item =>
        item.includes(value.slice(value.lastIndexOf(' ') + 1)),
      );
    },
  );
});

const agentSchema = Yup.lazy(value => {
  if (value) {
    return Yup.string().test('is-valid-agent', 'agent invalid', function(
      value,
    ) {
      let agents = this.options.context.agents;
      agents = agents.map(item => item['firstName'].toLowerCase());
      const firstName = value.slice(0, value.indexOf(' ')).toLowerCase();
      return agents.includes(firstName);
    });
  } else {
    return Yup.mixed().notRequired();
  }
});
export const inboundCallValidateSchema = () => {
  const schema = Yup.array().of(
    Yup.object().shape({
      agent: agentSchema,
      team: departmentSchema,
    }),
  );

  return schema;
};
