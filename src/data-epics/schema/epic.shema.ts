import * as Yup from 'yup';
const dateValidationSchema = Yup.lazy(value => {
  if (value !== null) {
    return Yup.date().typeError('Invalid date');
  } else {
    return Yup.mixed().notRequired();
  }
});
const agentSchema = Yup.lazy(value => {
  if (value) {
    return Yup.string().test('is-valid-agent', 'agent invalid', function(
      value,
    ) {
      let agents = this.options.context.agents;
      agents = agents.map(item => item['firstName'].toLowerCase());
      return agents.includes(value.toLowerCase());
    });
  } else {
    return Yup.mixed().notRequired();
  }
});
export const epicValidateSchema = () => {
  const schema = Yup.array().of(
    Yup.object().shape({
      createdTime: dateValidationSchema,
      updatedTime: dateValidationSchema,
      createdBy: agentSchema,
      updatedBy: agentSchema,
    }),
  );

  return schema;
};
