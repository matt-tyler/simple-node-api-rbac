import { DefaultApi } from "../src/api";
import axios from "axios";


describe("Test My API: Create 3 messages", () => {
    const instance = axios.create({
        headers: {
            Authorization: process.env['TOKEN']
        }
    })

    const api = new DefaultApi({},
        process.env["ENDPOINT"],
        instance
    );

    const messages = [
        "message 1",
        "message 2",
        "message 3"
    ];

    beforeEach(async (done) => {
        for (const message of messages) {
            await api.createMessage(message);
        }
        done();
    });

    it("should return messages", async (done) => {
        const { data } = await api.listMessages(3);
        expect(data.items.length).toBe(3);
        
        expect(data.items).toEqual(
            expect.arrayContaining(
                messages.map(message => expect.objectContaining({
                    message,
                    author: expect.anything(),
                    date: expect.anything()
                }))
            ));
        done();
    });
})