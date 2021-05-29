import { IStringIdentifiable } from 'pip-services3-commons-nodex';

export class Dummy implements IStringIdentifiable {
    public id: string;
    public key: string;
    public content: string;
}