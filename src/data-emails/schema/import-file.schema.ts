import * as Yup from 'yup';

const dateValidationSchema = Yup.lazy(value => {
  if (value) {
    return Yup.date().typeError('Invalid date');
  } else {
    return Yup.string().notRequired();
  }
});

export const importFileSchema = () => {
  const schema = Yup.array().of(
    Yup.object().shape({
      // sent: dateValidationSchema,
      // received: dateValidationSchema,
      // originalPath: Yup.string(),
      // subjectOrTitle: Yup.string(),
      // senderOrCreated: Yup.string(),
      // recipientsIntoLine: Yup.string(),
      // recipientInCcLine: Yup.string()
      sent: dateValidationSchema,
      received: dateValidationSchema,
      originalPath: Yup.string(),
      subjectOrTitle: Yup.string(),
      senderOrCreated: Yup.string(),
      recipientsInToLine: Yup.string(),
      recipientsInCcLine: Yup.string(),
    }),
  );

  return schema;
};
