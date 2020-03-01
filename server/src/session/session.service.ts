import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserUpdateLocationDto } from "../user/user.dto";
import { Domain } from "../domain/domain.schema";
import { User } from "../user/user.schema";
import { DomainSession, UserSession } from "./session.schema";

@Injectable()
export class SessionService {
	private readonly heartbeatMs = 1000 * 30;

	constructor(
		// services
		// @Inject(forwardRef(() => UserService))
		// private readonly userService: UserService,
		// @Inject(forwardRef(() => DomainService))
		// private readonly domainService: DomainService,

		// database
		@InjectModel("users.sessions")
		readonly userSessionModel: Model<UserSession>,
		@InjectModel("domains.sessions")
		readonly domainSessionModel: Model<DomainSession>,
	) {}

	findUserById = (userId: string) => this.userSessionModel.findById(userId);
	findDomainById = (domainId: string) =>
		this.domainSessionModel.findById(domainId);

	getUserCount = () => this.userSessionModel.countDocuments();
	getDomainCount = () => this.domainSessionModel.countDocuments();

	private getExpireTime() {
		return Date.now() + this.heartbeatMs;
	}

	async heartbeatUser(user: User): Promise<UserSession> {
		let session = await this.findUserById(user._id);

		if (session == null) {
			session = new this.userSessionModel({
				_id: user._id,
				user,
				expireAt: this.getExpireTime(),
			});
			await session.save();
		} else {
			// reset expire
			session.expireAt = this.getExpireTime() as any;
			await session.save();

			// minutes since online
			const oldMinutes = session.minutes;
			const newMinutes = Math.floor(
				(Date.now() - session.createdAt.valueOf()) / 1000 / 60,
			);

			// session.minutes needs to be updated
			if (oldMinutes < newMinutes) {
				const minutesToAddToUser = newMinutes - oldMinutes;
				session.minutes = newMinutes; // sync again
				await session.save();

				// update user
				user.minutes += minutesToAddToUser;
				await user.save();
			}
		}

		return session;
	}

	async updateUserLocation(
		user: User,
		userUpdateLocationDto: UserUpdateLocationDto,
	): Promise<UserSession> {
		const session = await this.heartbeatUser(user);

		const {
			path,
			node_id: nodeId,
			domain_id: domainId,
		} = userUpdateLocationDto.location;

		//const prevDomain = session.domain;

		// if (prevDomain == null) {
		// 	// add to domainSession
		// 	await this.domainSessionModel.updateOne(
		// 		{ _id: domainId },
		// 		{ $addToSet: { userSessions: session } },
		// 	);
		// } else if (prevDomain.id != domainId) {
		// 	// changed domain, clean up from old domainSession
		// 	await this.domainSessionModel.updateOne(
		// 		{ _id: prevDomain._id },
		// 		{ $pull: { userSessions: session._id } },
		// 	);
		// 	// add to domainSession
		// 	await this.domainSessionModel.updateOne(
		// 		{ _id: domainId },
		// 		{ $addToSet: { userSessions: session } },
		// 	);
		// }

		session.path = path;
		session.nodeId = nodeId;
		session.domain = domainId as any; // reference
		await session.save();

		await this.domainSessionModel.updateOne(
			{ _id: domainId },
			{ $addToSet: { userSessions: session } },
		);

		return session;
	}

	async heartbeatDomain(domain: Domain) {
		let session = await this.findDomainById(domain._id);

		if (session == null) {
			session = new this.domainSessionModel({
				_id: domain._id,
				domain,
				expireAt: this.getExpireTime(),
			});

			await session.save();
		} else {
			session.expireAt = this.getExpireTime() as any;

			await session.save();
		}

		return session;
	}
}
