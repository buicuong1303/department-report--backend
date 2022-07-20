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
    return Yup.string().test(
      'is-valid-agent',
      'agent or mainline invalid',
      function(value) {
        let agents = this.options.context.agents;
        agents = agents.map(item =>
          (
            item['firstName'].toLowerCase() +
            ' ' +
            item['lastName'].toLowerCase()
          ).trim(),
        );

        return agents.includes(value.toLowerCase().trim());
      },
    );
  } else {
    return Yup.mixed().notRequired();
  }
});
export const phoneValidateSchema = () => {
  const schema = Yup.array().of(
    Yup.object().shape({
      agent: Yup.object().shape({
        name: agentSchema,
        index: Yup.mixed().required(),
      }),
    }),
  );

  return schema;
};
