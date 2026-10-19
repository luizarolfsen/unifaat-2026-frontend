import { DataTypes } from 'sequelize'
import sequelize from '../../database/connections/sequelize.js'

const TaskModel = sequelize.define(
    'TaskModel',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        is_done: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },

        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        tableName: 'tasks',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
)

export default TaskModel
