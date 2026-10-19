import { DataTypes } from 'sequelize'
import sequelize from '../../database/connections/sequelize.js'

const UserModel = sequelize.define(
    'UserModel',
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

        email: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },

        password: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        picture: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        job_title: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        city: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        state: {
            type: DataTypes.CHAR(2),
            allowNull: true
        },

        birth_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
)

export default UserModel