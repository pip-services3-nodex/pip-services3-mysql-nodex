import { IIdentifiable } from 'pip-services3-commons-nodex';

export class Dummy2 implements IIdentifiable<number> {
    public id: number;
    public key: string;
    public content: string;
}