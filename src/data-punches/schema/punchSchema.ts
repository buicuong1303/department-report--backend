import * as Yup from 'yup';

export default agents => {
  const schema = Yup.array().of(
    Yup.object().shape({
      checkIn: Yup.string(),
      firstName: Yup.string()
        .required()
        .test('firstName', 'Not found Agent', function(value) {
          const lastName = this.parent.lastName.trim();
          let check = false;
          for (let i = 0; i < agents.length; i++) {
            if (
              agents[i]
                .toLowerCase()
                .includes(`${value.trim()} ${lastName}`.trim().toLowerCase())
            ) {
              return (check = true);
            }
          }
          return check;
        }),
      lastName: Yup.string()
        .required()
        .test('lastName', 'Not found Agent', function(value) {
          const firstName = this.parent.firstName.trim();
          let check = false;
          for (let i = 0; i < agents.length; i++) {
            if (
              agents[i]
                .toLowerCase()
                .includes(`${firstName} ${value}`.trim().toLowerCase())
            ) {
              return (check = true);
            }
          }
          return check;
        }),
      checkOut: Yup.string(),
      punchDate: Yup.string().required(),
    }),
  );
  return schema;
};
