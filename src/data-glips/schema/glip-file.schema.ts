import * as Yup from 'yup';
import * as moment from 'moment';
const dateValidationSchema = Yup.lazy(value => {
  if (value) {
    return Yup.date().typeError('Is valid date');
  } else {
    return Yup.mixed().notRequired();
  }
});

const timeValidationSchema = Yup.lazy(value => {
  if (value) {
    return Yup.mixed().test('is-time', 'value must be time', function(value) {
      return moment(value, 'HH:mm:ss').isValid();
    });
  } else {
    return Yup.mixed().notRequired();
  }
});

const createdTimeSchema = Yup.lazy(value => {
  if (value) {
    return Yup.mixed().test('is-time', 'value must be time', function(value) {
      return moment(value, 'HH:mm:ss').isValid();
    });
  } else {
    return Yup.string().required('In is required');
  }
});

const servedTimeSchema = Yup.lazy(value => {
  if (value) {
    return Yup.mixed().test(
      'is-greater',
      'value must be after or same created time',
      function(value) {
        const { createdTime } = this.parent;
        return moment(value, 'HH:mm:ss').isSameOrAfter(
          moment(createdTime, 'HH:mm:ss'),
        );
      },
    );
  } else {
    return Yup.mixed().notRequired();
  }
});

const completedTimeSchema = Yup.lazy(value => {
  if (value) {
    return Yup.mixed().test(
      'is-greater',
      'value must be after or same served time',
      function(value) {
        const { servedTime, createdTime } = this.parent;
        if (servedTime)
          return moment(value, 'HH:mm:ss').isSameOrAfter(
            moment(servedTime, 'HH:mm:ss'),
          );
        else {
          return moment(value, 'HH:mm:ss').isSameOrAfter(
            moment(createdTime, 'HH:mm:ss'),
          );
        }
      },
    );
  } else {
    return Yup.mixed().notRequired();
  }
});

const departmentSchema = Yup.lazy(value => {
  return Yup.string().test(
    'is-valid-department',
    'department invalid',
    function(value) {
      let departments = this.options.context.departments;
      let sliceDepartment = '';
      if (value.indexOf('-') > -1) {
        sliceDepartment = value.slice(value.indexOf('-') + 2).trim();
      } else {
        sliceDepartment = value.trim();
      }
      departments = departments.map(item => item['name'].toLowerCase());
      // value.slice(value.indexOf('-') + 2).trim()
      return departments.includes(
        sliceDepartment
          .toLowerCase()
          .slice(0, sliceDepartment.lastIndexOf(' ')),
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
      agents = agents.map(item => item['firstName']);
      return agents.includes(value.slice(0, value.indexOf(' ')));
    });
  } else {
    return Yup.mixed().notRequired();
  }
});
const agentSchemaRequired = Yup.lazy(value => {
  if (value) {
    return Yup.string().test('is-valid-agent', 'agent invalid', function(
      value,
    ) {
      let agents = this.options.context.agents;
      agents = agents.map(item => item['firstName']);
      return agents.includes(value.slice(0, value.indexOf(' ')));
    });
  } else {
    return Yup.string().required('Created by is required');
  }
});
export const glipValidateSchema = () => {
  const schema = Yup.array().of(
    Yup.object().shape({
      team: departmentSchema,

      dateGlipMaster: dateValidationSchema,

      name: Yup.string().required('Name is required'),

      type: Yup.string().oneOf(['Appointment', 'Walk-in']),

      createdTime: createdTimeSchema,

      servedTime: servedTimeSchema,

      completedTime: completedTimeSchema,

      agent: Yup.mixed()
        .when('servedTime', {
          is: val => val,
          then: agentSchema,
        })
        .when('servedTime', {
          is: val => !val,
          then: Yup.mixed().test('is-empty', 'Agent must be empty', function(
            value,
          ) {
            return !value;
          }),
        }),

      finalStatus: Yup.mixed()
        .when('completedTime', {
          is: val => val,
          then: Yup.string().notRequired(),
        })
        .when('completedTime', {
          is: val => !val,
          then: Yup.mixed().test(
            'is-empty',
            'FinalStatus must be empty',
            function(value) {
              return !value;
            },
          ),
        }),

      createdBy: agentSchemaRequired,
    }),
  );

  return schema;
};
